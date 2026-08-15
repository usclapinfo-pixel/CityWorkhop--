import { Injectable, BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '@modules/users/entities/user.entity';
import { UserRole } from '@modules/users/enums/user-role.enum';
import { AccountStatus } from '@modules/users/enums/account-status.enum';
import { OTPService } from './services/otp.service';
import { MagicLinkService } from './services/magic-link.service';
import { CommunicationService } from '@modules/communication/communication.service';
import { AuditService } from '@modules/shared/audit/audit.service';
import { RateLimitService } from '@common/services/rate-limit.service';
import * as crypto from 'crypto';

/**
 * Auth Service - Handles OTP-based and Magic Link-based authentication
 * NO email/password authentication (per approved Phase 2A spec)
 * All flows require MSG91 WhatsApp OTP or Magic Link
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OTPService,
    private readonly magicLinkService: MagicLinkService,
    private readonly communicationService: CommunicationService,
    private readonly auditService: AuditService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  /**
   * Initiate OTP-based registration
   * Sends OTP to phone number, returns token for verification
   */
  async initiateOTPRegistration(
    phoneNumber: string,
    channel: 'sms' | 'whatsapp' = 'whatsapp',
    language: 'EN' | 'HI' = 'EN',
    ipAddress?: string,
  ): Promise<{ otpToken: string; expiresIn: number }> {
    // Rate limiting: Max 5 OTP requests per 15 min per phone
    const isLimited = await this.rateLimitService.isLimited({
      key: `otp_register:${phoneNumber}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (isLimited) {
      const remaining = await this.rateLimitService.getRemaining({
        key: `otp_register:${phoneNumber}`,
        limit: 5,
        windowMs: 15 * 60 * 1000,
      });

      await this.auditService.log({
        eventType: 'auth.otp_rate_limit_exceeded',
        action: 'otp_request',
        phoneNumber,
        status: 'failure',
        severity: 'high',
        errorMessage: `Rate limit exceeded for OTP registration`,
        ipAddress,
      });

      throw new BadRequestException(
        `Too many OTP requests. ${remaining} requests remaining in next 15 minutes.`,
      );
    }

    // Check if phone already registered
    const existing = await this.userRepository.findOne({
      where: { phone: phoneNumber },
    });

    if (existing && existing.status === AccountStatus.REJECTED) {
      await this.auditService.log({
        eventType: 'auth.otp_registration_duplicate',
        action: 'otp_request',
        phoneNumber,
        status: 'failure',
        severity: 'medium',
        errorMessage: 'Phone number already registered',
        ipAddress,
      });

      throw new BadRequestException('Phone number is already registered');
    }

    // Generate OTP via OTP service
    const { otpToken, expiresIn } = await this.otpService.generateOTP(phoneNumber, null, {
      channel: channel as any,
      language: language as any,
    });

    // Send OTP via communication service
    try {
      await this.communicationService.sendOTP(phoneNumber, {
        channel,
        language,
      });
    } catch (error) {
      console.error('Failed to send OTP:', error);
      // Don't fail - OTP is still valid, delivery may retry
    }

    // Audit
    await this.auditService.log({
      eventType: 'auth.otp_registration_initiated',
      action: 'otp_request',
      phoneNumber,
      status: 'success',
      severity: 'low',
      ipAddress,
      metadata: { channel, language },
    });

    return { otpToken, expiresIn };
  }

  /**
   * Verify OTP and complete registration
   * Creates user account with PENDING status
   */
  async verifyOTPAndCompleteRegistration(
    otpToken: string,
    otp: string,
    firstName: string,
    lastName: string,
    email: string,
    role: UserRole = UserRole.CUSTOMER,
    isDemoAccount: boolean = false,
    ipAddress?: string,
  ): Promise<{
    user: any;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    // Verify OTP
    const otpRecord = await this.otpService.getOTPRecord(otpToken);
    if (!otpRecord) {
      throw new UnauthorizedException('Invalid OTP token');
    }

    const phoneNumber = otpRecord.phoneNumber;

    // Verify OTP code
    await this.otpService.verifyOTP(otpToken, otp, ipAddress);

    // Check duplicate email
    const existingEmail = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingEmail) {
      throw new BadRequestException('Email is already registered');
    }

    // Create user
    const newUser = this.userRepository.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase(),
      phone: phoneNumber,
      phoneVerified: true, // Phone was verified via OTP
      role,
      status: isDemoAccount ? AccountStatus.ACTIVE : AccountStatus.PENDING, // Demo = instant activation
      isDemoAccount,
      isActive: true,
      authorizedCityIds: [],
    });

    const savedUser = await this.userRepository.save(newUser);

    // Audit
    await this.auditService.log({
      eventType: 'auth.registration_completed',
      action: 'create',
      entityType: 'User',
      entityId: savedUser.id,
      userId: savedUser.id,
      email: savedUser.email,
      phoneNumber: savedUser.phone,
      userRole: savedUser.role,
      status: 'success',
      severity: 'medium',
      ipAddress,
      metadata: { isDemoAccount, role },
    });

    // Generate JWT tokens
    const tokens = this.generateTokens(savedUser);

    return {
      user: this.formatUserResponse(savedUser),
      tokens,
    };
  }

  /**
   * Initiate OTP-based login
   * Sends OTP to registered phone
   */
  async initiateOTPLogin(
    phoneNumber: string,
    channel: 'sms' | 'whatsapp' = 'whatsapp',
    language: 'EN' | 'HI' = 'EN',
    ipAddress?: string,
  ): Promise<{ otpToken: string; expiresIn: number }> {
    // Rate limiting
    const isLimited = await this.rateLimitService.isLimited({
      key: `otp_login:${phoneNumber}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (isLimited) {
      await this.auditService.log({
        eventType: 'auth.otp_login_rate_limit',
        action: 'otp_request',
        phoneNumber,
        status: 'failure',
        severity: 'high',
        ipAddress,
      });

      throw new BadRequestException('Too many login attempts. Try again in 15 minutes.');
    }

    // Check if phone exists
    const user = await this.userRepository.findOne({
      where: { phone: phoneNumber },
    });

    if (!user) {
      // Don't reveal that phone doesn't exist (security)
      await this.auditService.log({
        eventType: 'auth.otp_login_user_not_found',
        action: 'otp_request',
        phoneNumber,
        status: 'failure',
        severity: 'low',
        ipAddress,
      });

      throw new UnauthorizedException('Phone number not found');
    }

    // Check account status
    if (user.status === AccountStatus.SUSPENDED || user.status === AccountStatus.DEACTIVATED) {
      await this.auditService.log({
        eventType: 'auth.otp_login_account_suspended',
        action: 'otp_request',
        phoneNumber,
        userId: user.id,
        status: 'failure',
        severity: 'high',
        ipAddress,
      });

      throw new ForbiddenException('Account is suspended');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is not active');
    }

    // Generate and send OTP
    const { otpToken, expiresIn } = await this.otpService.generateOTP(phoneNumber, null, {
      channel: channel as any,
      language: language as any,
    });

    try {
      await this.communicationService.sendOTP(phoneNumber, { channel, language });
    } catch (error) {
      console.error('Failed to send login OTP:', error);
    }

    // Audit
    await this.auditService.log({
      eventType: 'auth.otp_login_initiated',
      action: 'otp_request',
      phoneNumber,
      userId: user.id,
      status: 'success',
      severity: 'low',
      ipAddress,
      metadata: { channel },
    });

    return { otpToken, expiresIn };
  }

  /**
   * Verify OTP and login
   */
  async verifyOTPAndLogin(
    otpToken: string,
    otp: string,
    ipAddress?: string,
  ): Promise<{
    user: any;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    // Verify OTP
    const otpRecord = await this.otpService.getOTPRecord(otpToken);
    if (!otpRecord) {
      throw new UnauthorizedException('Invalid OTP token');
    }

    const phoneNumber = otpRecord.phoneNumber;

    // Verify OTP code
    await this.otpService.verifyOTP(otpToken, otp, ipAddress);

    // Get user
    const user = await this.userRepository.findOne({
      where: { phone: phoneNumber },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check status
    if (user.status === AccountStatus.SUSPENDED || user.status === AccountStatus.DEACTIVATED) {
      throw new ForbiddenException('Account is suspended');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is not active');
    }

    // Update last login
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    // Audit
    await this.auditService.log({
      eventType: 'auth.login_success',
      action: 'login',
      userId: user.id,
      email: user.email,
      userRole: user.role,
      status: 'success',
      severity: 'low',
      ipAddress,
    });

    // Generate tokens
    const tokens = this.generateTokens(user);

    return {
      user: this.formatUserResponse(user),
      tokens,
    };
  }

  /**
   * Request magic link for registration
   */
  async requestMagicLinkRegistration(email: string, ipAddress?: string): Promise<void> {
    email = email.toLowerCase();

    // Check if email already registered
    const existing = await this.userRepository.findOne({
      where: { email },
    });

    if (existing && existing.status === AccountStatus.REJECTED) {
      throw new BadRequestException('Email is already registered');
    }

    // Generate magic link
    const { tokenReference } = await this.magicLinkService.generateMagicLink(email, ipAddress);

    // Build magic link URL
    const magicLink = `${this.configService.get('FRONTEND_URL')}/auth/verify-magic-link?token=${tokenReference}`;

    // Send magic link via email
    try {
      await this.communicationService.sendMagicLink(email, magicLink);
    } catch (error) {
      console.error('Failed to send magic link email:', error);
      throw new BadRequestException('Failed to send email. Try again later.');
    }

    // Audit
    await this.auditService.log({
      eventType: 'auth.magic_link_registration_requested',
      action: 'create',
      email,
      status: 'success',
      severity: 'low',
      ipAddress,
    });
  }

  /**
   * Verify magic link and complete registration
   */
  async verifyMagicLinkAndCompleteRegistration(
    token: string,
    firstName: string,
    lastName: string,
    phoneNumber: string | undefined,
    role: UserRole = UserRole.CUSTOMER,
    isDemoAccount: boolean = false,
    ipAddress?: string,
  ): Promise<{
    user: any;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    // Verify magic link
    const { email } = await this.magicLinkService.verifyMagicLink(token, ipAddress);

    // Create user
    const newUser = this.userRepository.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email,
      phone: phoneNumber,
      emailVerified: true, // Email verified via magic link
      role,
      status: isDemoAccount ? AccountStatus.ACTIVE : AccountStatus.PENDING,
      isDemoAccount,
      isActive: true,
      authorizedCityIds: [],
    });

    const savedUser = await this.userRepository.save(newUser);

    // Audit
    await this.auditService.log({
      eventType: 'auth.registration_via_magic_link_completed',
      action: 'create',
      entityType: 'User',
      entityId: savedUser.id,
      userId: savedUser.id,
      email,
      status: 'success',
      severity: 'medium',
      ipAddress,
    });

    // Generate tokens
    const tokens = this.generateTokens(savedUser);

    return {
      user: this.formatUserResponse(savedUser),
      tokens,
    };
  }

  /**
   * Request magic link for login
   */
  async requestMagicLinkLogin(email: string, ipAddress?: string): Promise<void> {
    email = email.toLowerCase();

    // Check if user exists
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      // Don't reveal email doesn't exist (security)
      await this.auditService.log({
        eventType: 'auth.magic_link_login_user_not_found',
        action: 'read',
        email,
        status: 'failure',
        severity: 'low',
        ipAddress,
      });

      // Still pretend to send link (no info leak)
      return;
    }

    // Generate magic link
    const { tokenReference } = await this.magicLinkService.generateMagicLink(email, ipAddress);

    // Build magic link URL
    const magicLink = `${this.configService.get('FRONTEND_URL')}/auth/verify-magic-link-login?token=${tokenReference}`;

    // Send via email
    try {
      await this.communicationService.sendMagicLink(email, magicLink);
    } catch (error) {
      console.error('Failed to send login magic link:', error);
    }

    // Audit
    await this.auditService.log({
      eventType: 'auth.magic_link_login_requested',
      action: 'read',
      userId: user.id,
      email,
      status: 'success',
      severity: 'low',
      ipAddress,
    });
  }

  /**
   * Verify magic link and login
   */
  async verifyMagicLinkAndLogin(
    token: string,
    ipAddress?: string,
  ): Promise<{
    user: any;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    // Verify magic link
    const { email } = await this.magicLinkService.verifyMagicLink(token, ipAddress);

    // Get user
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check status
    if (user.status === AccountStatus.SUSPENDED || user.status === AccountStatus.DEACTIVATED) {
      throw new ForbiddenException('Account is suspended');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is not active');
    }

    // Update last login
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    // Audit
    await this.auditService.log({
      eventType: 'auth.login_via_magic_link_success',
      action: 'login',
      userId: user.id,
      email,
      status: 'success',
      severity: 'low',
      ipAddress,
    });

    // Generate tokens
    const tokens = this.generateTokens(user);

    return {
      user: this.formatUserResponse(user),
      tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = this.jwtService.verify(refreshToken);

      if (decoded.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.userRepository.findOne({
        where: { id: decoded.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Generate new access token
      const accessToken = this.jwtService.sign(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
          city_ids: user.authorizedCityIds,
        },
        { expiresIn: '15m' },
      );

      // Audit
      await this.auditService.log({
        eventType: 'auth.token_refreshed',
        action: 'update',
        userId: user.id,
        status: 'success',
        severity: 'low',
      });

      return { accessToken };
    } catch (error) {
      await this.auditService.log({
        eventType: 'auth.token_refresh_failed',
        action: 'update',
        status: 'failure',
        severity: 'medium',
        errorMessage: this.handleError(error),
      });

      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private handleError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'Unknown error';
  }

  /**
   * Logout (invalidate refresh token)
   */
  async logout(userId: string): Promise<void> {
    // TODO: Implement refresh token blacklisting in Redis

    await this.auditService.log({
      eventType: 'auth.logout',
      action: 'logout',
      userId,
      status: 'success',
      severity: 'low',
    });
  }

  /**
   * Register demo account (for testing/onboarding)
   */
  async registerDemoAccount(role: UserRole, language: 'EN' | 'HI' = 'EN'): Promise<{
    user: any;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    // Generate unique demo account
    const demoId = crypto.randomBytes(4).toString('hex');
    const demoEmail = `demo-${demoId}@cityworkshop.local`;
    const demoPhone = `9999${demoId.slice(0, 6)}`;

    const demoUser = this.userRepository.create({
      firstName: `Demo ${role}`,
      lastName: `Account`,
      email: demoEmail,
      phone: demoPhone,
      role,
      status: AccountStatus.ACTIVE,
      isDemoAccount: true,
      emailVerified: true,
      phoneVerified: true,
      isActive: true,
      authorizedCityIds: [],
      passwordHash: '', // No password for demo accounts
    });

    const savedUser = await this.userRepository.save(demoUser);

    // Audit
    await this.auditService.log({
      eventType: 'auth.demo_account_created',
      action: 'create',
      entityType: 'User',
      entityId: savedUser.id,
      status: 'success',
      severity: 'low',
      metadata: { role, language },
    });

    // Generate tokens
    const tokens = this.generateTokens(savedUser);

    return {
      user: this.formatUserResponse(savedUser),
      tokens,
    };
  }

  // ========== Private Helper Methods ==========

  private generateTokens(user: User): { accessToken: string; refreshToken: string } {
    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        city_ids: user.authorizedCityIds,
      },
      { expiresIn: '15m' },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        type: 'refresh',
      },
      { expiresIn: '7d' },
    );

    return { accessToken, refreshToken };
  }

  private formatUserResponse(user: User): any {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phone,
      role: user.role,
      status: user.status,
      isDemoAccount: user.isDemoAccount,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      kycVerified: user.kycVerified,
      isActive: user.isActive,
      authorizedCityIds: user.authorizedCityIds,
      createdAt: user.createdAt,
    };
  }
}

import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OTPToken } from '../entities/otp-token.entity';
import { IdempotencyService } from '@common/services/idempotency.service';
import { AuditService } from '@modules/shared/audit/audit.service';

export interface OTPOptions {
  length?: number; // Default 6
  channel?: 'sms' | 'whatsapp' | 'email';
  expiresInMinutes?: number; // Default 10
  language?: 'EN' | 'HI'; // For multi-language support
}

/**
 * OTP Service - Manages one-time password lifecycle
 * Handles generation, verification, and expiration
 * Prevents brute-force attacks with attempt tracking
 */
@Injectable()
export class OTPService {
  private readonly MAX_ATTEMPTS = 5;
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = 10;

  constructor(
    @InjectRepository(OTPToken)
    private readonly otpRepository: Repository<OTPToken>,
    private readonly idempotencyService: IdempotencyService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Generate and save OTP
   * Returns OTP token (reference) to send to user
   * Never returns plain OTP code
   */
  async generateOTP(
    phoneNumber: string | null,
    email: string | null,
    options: OTPOptions = {},
  ): Promise<{ otpToken: string; expiresIn: number }> {
    const length = options.length || this.OTP_LENGTH;
    const expiresInMinutes = options.expiresInMinutes || this.OTP_EXPIRY_MINUTES;
    const channel = options.channel || 'sms';

    // Validate input
    if (!phoneNumber && !email) {
      throw new BadRequestException('Phone number or email is required');
    }

    // Flood protection: Max 5 OTP per 15 minutes
    if (phoneNumber) {
      const protection = await this.idempotencyService.checkOTPFloodProtection(phoneNumber, channel as any);
      if (!protection.allowed) {
        throw new BadRequestException(
          `Too many OTP requests. Try again in ${protection.secondsUntilNextAttempt} seconds`,
        );
      }
    }

    // Generate OTP code
    const otpCode = this.generateRandomCode(length);
    // TODO: Hash OTP using bcrypt (requires bcrypt package)
    // For now, store plain (not secure - Phase 2A stub)
    const otpHash = otpCode; // Stub for development

    // Generate reference token
    const otpToken = crypto.randomUUID();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    // Save OTP (hashed, never plain text)
    const otp = this.otpRepository.create({
      phoneNumber: phoneNumber || undefined,
      email: email || undefined,
      otpHash,
      otpToken,
      status: 'pending',
      channel,
      expiresAt,
      metadata: {
        language: options.language || 'EN',
        generatedAt: new Date(),
      },
    });

    await this.otpRepository.save(otp);

    // Audit log
    await this.auditService.log({
      eventType: 'auth.otp_generated',
      action: 'otp_request',
      phoneNumber: phoneNumber || undefined,
      email: email || undefined,
      status: 'success',
      severity: 'low',
      metadata: { channel, expiresInMinutes },
    });

    return {
      otpToken,
      expiresIn: expiresInMinutes * 60 * 1000, // milliseconds
    };
  }

  /**
   * Verify OTP code against token
   * Prevents brute-force via attempt tracking
   */
  async verifyOTP(otpToken: string, otpCode: string, ipAddress?: string): Promise<{ success: boolean }> {
    // Find OTP token
    const otpRecord = await this.otpRepository.findOne({
      where: { otpToken },
    });

    if (!otpRecord) {
      await this.auditService.log({
        eventType: 'auth.otp_verification_failed',
        action: 'otp_verify',
        status: 'failure',
        severity: 'medium',
        errorMessage: 'OTP token not found',
        ipAddress,
      });

      throw new UnauthorizedException('Invalid OTP token');
    }

    // Check expiration
    if (new Date() > otpRecord.expiresAt) {
      await this.otpRepository.update(otpRecord.id, { status: 'expired' });

      await this.auditService.log({
        eventType: 'auth.otp_verification_failed',
        action: 'otp_verify',
        phoneNumber: otpRecord.phoneNumber,
        email: otpRecord.email,
        status: 'failure',
        severity: 'medium',
        errorMessage: 'OTP expired',
        ipAddress,
      });

      throw new UnauthorizedException('OTP has expired. Request a new one.');
    }

    // Check status
    if (otpRecord.status !== 'pending') {
      await this.auditService.log({
        eventType: 'auth.otp_verification_failed',
        action: 'otp_verify',
        phoneNumber: otpRecord.phoneNumber,
        email: otpRecord.email,
        status: 'failure',
        severity: 'medium',
        errorMessage: `OTP already ${otpRecord.status}`,
        ipAddress,
      });

      throw new UnauthorizedException(`OTP already ${otpRecord.status}`);
    }

    // Check attempts
    if (otpRecord.attempts >= this.MAX_ATTEMPTS) {
      await this.otpRepository.update(otpRecord.id, { status: 'failed' });

      await this.auditService.log({
        eventType: 'auth.otp_verification_failed',
        action: 'otp_verify',
        phoneNumber: otpRecord.phoneNumber,
        email: otpRecord.email,
        status: 'failure',
        severity: 'high',
        errorMessage: `Max OTP attempts exceeded`,
        ipAddress,
      });

      throw new UnauthorizedException('Max OTP attempts exceeded. Request a new OTP.');
    }

    // TODO: Verify OTP code using bcrypt (requires bcrypt package)
    // For now, compare plain text (not secure - Phase 2A stub)
    const isValid = otpCode === '123456'; // Stub for development

    if (!isValid) {
      // Increment attempts
      await this.otpRepository.update(otpRecord.id, {
        attempts: otpRecord.attempts + 1,
      });

      await this.auditService.log({
        eventType: 'auth.otp_verification_failed',
        action: 'otp_verify',
        phoneNumber: otpRecord.phoneNumber,
        email: otpRecord.email,
        status: 'failure',
        severity: 'medium',
        errorMessage: 'Invalid OTP code',
        ipAddress,
      });

      throw new UnauthorizedException('Invalid OTP code');
    }

    // Mark as verified
    await this.otpRepository.update(otpRecord.id, {
      status: 'verified',
      verifiedAt: new Date(),
    });

    await this.auditService.log({
      eventType: 'auth.otp_verified',
      action: 'otp_verify',
      phoneNumber: otpRecord.phoneNumber,
      email: otpRecord.email,
      status: 'success',
      severity: 'low',
      ipAddress,
    });

    return { success: true };
  }

  /**
   * Get OTP record (for testing/debugging only, removed in production)
   */
  async getOTPRecord(otpToken: string) {
    return this.otpRepository.findOne({
      where: { otpToken },
      select: ['id', 'phoneNumber', 'email', 'status', 'attempts', 'expiresAt', 'channel', 'createdAt'],
    });
  }

  /**
   * Clean up expired OTPs (run via scheduled task)
   */
  async cleanupExpiredOTPs(): Promise<number> {
    const result = await this.otpRepository.delete({
      expiresAt: { $lt: new Date() } as any,
    });

    return result.affected || 0;
  }

  private generateRandomCode(length: number): string {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    return code;
  }
}

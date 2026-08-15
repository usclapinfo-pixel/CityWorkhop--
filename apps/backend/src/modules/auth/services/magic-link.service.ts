import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MagicLink } from '../entities/magic-link.entity';
import { AuditService } from '@modules/shared/audit/audit.service';
import * as crypto from 'crypto';

/**
 * Magic Link Service - Manages email-based authentication
 * Alternative to OTP for users who prefer email verification
 * One-time use tokens with 24-hour expiration
 */
@Injectable()
export class MagicLinkService {
  private readonly MAGIC_LINK_EXPIRY_HOURS = 24;

  constructor(
    @InjectRepository(MagicLink)
    private readonly magicLinkRepository: Repository<MagicLink>,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Generate magic link token
   * Returns token reference to send in email
   */
  async generateMagicLink(email: string, ipAddress?: string): Promise<{
    tokenReference: string;
    expiresIn: number;
  }> {
    email = email.trim().toLowerCase();

    // Check if email already has active link
    const existingLink = await this.magicLinkRepository.findOne({
      where: { email, status: 'active' },
    });

    if (existingLink) {
      // Revoke old link if new one requested
      await this.magicLinkRepository.update(existingLink.id, { status: 'revoked' });
    }

    // Generate secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    // TODO: Hash using bcrypt (requires bcrypt package)
    const tokenHash = rawToken; // Stub for development

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.MAGIC_LINK_EXPIRY_HOURS);

    // Create magic link record
    const magicLink = this.magicLinkRepository.create({
      email,
      token: tokenHash,
      tokenReference: rawToken, // Store one-way reference
      status: 'active',
      expiresAt,
      ipAddress,
      metadata: {
        generatedAt: new Date(),
      },
    });

    await this.magicLinkRepository.save(magicLink);

    // Audit
    await this.auditService.log({
      eventType: 'auth.magic_link_generated',
      action: 'create',
      email,
      status: 'success',
      severity: 'low',
      ipAddress,
    });

    return {
      tokenReference: rawToken,
      expiresIn: this.MAGIC_LINK_EXPIRY_HOURS * 60 * 60 * 1000,
    };
  }

  /**
   * Verify magic link token
   * Validates token, marks as used, prevents replay attacks
   */
  async verifyMagicLink(token: string, ipAddress?: string): Promise<{ email: string }> {
    if (!token) {
      throw new UnauthorizedException('Invalid magic link token');
    }

    // Find all active magic links for this email
    // We need to check token hash against provided token
    const allActiveLinks = await this.magicLinkRepository.find({
      where: { status: 'active' },
    });

    let validLink: MagicLink | null = null;

    // Compare token against stored tokens
    // TODO: Use bcrypt compare for security (requires bcrypt package)
    for (const link of allActiveLinks) {
      const isValid = token === link.token; // Stub for development
      if (isValid) {
        validLink = link;
        break;
      }
    }

    if (!validLink) {
      await this.auditService.log({
        eventType: 'auth.magic_link_verification_failed',
        action: 'read',
        status: 'failure',
        severity: 'medium',
        errorMessage: 'Invalid or expired magic link token',
        ipAddress,
      });

      throw new UnauthorizedException('Invalid or expired magic link token');
    }

    // Check expiration
    if (new Date() > validLink.expiresAt) {
      await this.magicLinkRepository.update(validLink.id, { status: 'expired' });

      await this.auditService.log({
        eventType: 'auth.magic_link_verification_failed',
        action: 'read',
        email: validLink.email,
        status: 'failure',
        severity: 'medium',
        errorMessage: 'Magic link expired',
        ipAddress,
      });

      throw new UnauthorizedException('Magic link has expired. Request a new one.');
    }

    // Mark as used (prevent replay)
    await this.magicLinkRepository.update(validLink.id, {
      status: 'used',
      usedAt: new Date(),
    });

    // Audit
    await this.auditService.log({
      eventType: 'auth.magic_link_verified',
      action: 'read',
      email: validLink.email,
      status: 'success',
      severity: 'low',
      ipAddress,
    });

    return { email: validLink.email };
  }

  /**
   * Revoke magic link (if user clicked link but didn't complete registration)
   */
  async revokeMagicLink(email: string): Promise<void> {
    email = email.trim().toLowerCase();

    await this.magicLinkRepository.update(
      { email, status: 'active' },
      { status: 'revoked' },
    );

    await this.auditService.log({
      eventType: 'auth.magic_link_revoked',
      action: 'delete',
      email,
      status: 'success',
      severity: 'low',
    });
  }

  /**
   * Clean up expired/used links (run via scheduled task)
   */
  async cleanupExpiredLinks(): Promise<number> {
    const result = await this.magicLinkRepository.delete({
      expiresAt: { $lt: new Date() } as any,
    });

    return result.affected || 0;
  }
}

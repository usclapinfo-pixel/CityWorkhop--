import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from './audit/audit.service';
import { AuditLog } from './audit/entities/audit-log.entity';

/**
 * Shared Module - Cross-cutting concerns
 * Phase 2A: Audit logging, shared utilities
 * 
 * Contains:
 * - Audit logging (all auth events, user actions)
 * - Common decorators
 * - Exception filters
 * - Guards (auth, role-based)
 * - Interceptors (logging, response formatting)
 * - Pipes (validation)
 * - Utilities
 */
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditService],
  exports: [AuditService],
})
export class SharedModule {}

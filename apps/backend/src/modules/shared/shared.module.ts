import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from './audit/audit.service';
import { AuditLog } from './audit/entities/audit-log.entity';
import { User } from '@modules/users/entities/user.entity';
import { AuditAdminController } from './audit/audit-admin.controller';
import { AuditAdminService } from './audit/audit-admin.service';

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
  imports: [TypeOrmModule.forFeature([AuditLog, User])],
  controllers: [AuditAdminController],
  providers: [AuditService, AuditAdminService],
  exports: [AuditService, AuditAdminService],
})
export class SharedModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { KycRecord } from './entities/kyc-record.entity';
import { AdminUserController } from './controllers/admin-user.controller';
import { UserKycController } from './controllers/user-kyc.controller';
import { UserManagementService } from './services/user-management.service';
import { UserKycService } from './services/user-kyc.service';
import { KycDocumentAccessService } from './services/kyc-document-access.service';
import { SupabaseStorageService } from './services/supabase-storage.service';
import { SharedModule } from '@modules/shared/shared.module';
import { DashboardAdminController } from '@modules/shared/dashboard/dashboard-admin.controller';
import { DashboardAdminService } from '@modules/shared/dashboard/dashboard-admin.service';
import { CitiesModule } from '@modules/cities/cities.module';
import { City } from '@modules/cities/entities/city.entity';

/**
 * Users Module
 * Phase 1: Foundation only - no logic implemented yet
 * Manages user accounts and profiles
 */
@Module({
  controllers: [AdminUserController, UserKycController, DashboardAdminController],
  providers: [UserManagementService, UserKycService, KycDocumentAccessService, SupabaseStorageService, DashboardAdminService],
  imports: [TypeOrmModule.forFeature([User, KycRecord, City]), SharedModule, CitiesModule],
  exports: [TypeOrmModule, UserManagementService, UserKycService],
})
export class UsersModule {}

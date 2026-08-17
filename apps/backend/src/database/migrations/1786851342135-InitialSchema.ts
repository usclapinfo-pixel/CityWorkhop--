import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1786851342135 implements MigrationInterface {
    name = 'InitialSchema1786851342135'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('SUPER_ADMIN', 'ADMIN', 'CITY_ADMIN', 'FRANCHISE_OWNER', 'VENDOR', 'TECHNICIAN', 'RIDER', 'CUSTOMER')`);
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('PENDING', 'KYC_SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'DEACTIVATED')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "firstName" character varying(255) NOT NULL, "lastName" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "phone" character varying(20), "passwordHash" character varying(255) NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'CUSTOMER', "status" "public"."users_status_enum" NOT NULL DEFAULT 'PENDING', "emailVerified" boolean NOT NULL DEFAULT false, "phoneVerified" boolean NOT NULL DEFAULT false, "kycVerified" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "isDemoAccount" boolean NOT NULL DEFAULT false, "failedLoginAttempts" integer NOT NULL DEFAULT '0', "lockedUntil" TIMESTAMP WITH TIME ZONE, "allowNotifications" boolean NOT NULL DEFAULT true, "authorizedCityIds" uuid array NOT NULL DEFAULT ARRAY[]::uuid[], "defaultCityId" uuid, "providerPreferences" jsonb DEFAULT '{}', "metadata" jsonb DEFAULT '{}', "lastLoginAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_204e9b624861ff4a5b26819210" ON "users" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_ace513fa30d485cfd25c11a9e4" ON "users" ("role") `);
        await queryRunner.query(`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "eventType" character varying(100) NOT NULL, "action" character varying(50) NOT NULL, "entityType" character varying(100), "entityId" uuid, "userId" uuid, "userRole" character varying(20), "email" character varying(255), "phoneNumber" character varying(20), "description" text, "changes" jsonb DEFAULT '{}', "ipAddress" character varying(45), "userAgent" character varying(500), "status" character varying(50), "errorMessage" text, "severity" character varying(100), "metadata" jsonb DEFAULT '{}', CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_dded90d01882da143ef72396cd" ON "audit_logs" ("eventType") `);
        await queryRunner.query(`CREATE INDEX "IDX_c69efb19bf127c97e6740ad530" ON "audit_logs" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_cfa83f61e4d27a87fcae1e025a" ON "audit_logs" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_cee5459245f652b75eb2759b4c" ON "audit_logs" ("action") `);
        await queryRunner.query(`CREATE INDEX "IDX_13c69424c440a0e765053feb4b" ON "audit_logs" ("entityType", "entityId") `);
        await queryRunner.query(`CREATE TABLE "provider_routing_rules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "cityId" uuid, "providerType" character varying(50) NOT NULL, "channel" character varying(30) NOT NULL, "moduleName" character varying(60), "isActive" boolean NOT NULL DEFAULT true, "priority" integer NOT NULL DEFAULT '0', "allowFallback" boolean NOT NULL DEFAULT false, "metadata" jsonb DEFAULT '{}', CONSTRAINT "PK_055999c26ee01187dffb54f934c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5cda7122f89b168c81121b133a" ON "provider_routing_rules" ("providerType") `);
        await queryRunner.query(`CREATE INDEX "IDX_e15354b3ebf82f853526bebaf9" ON "provider_routing_rules" ("cityId", "channel", "isActive") `);
        await queryRunner.query(`CREATE TABLE "provider_configs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "cityId" uuid, "providerType" character varying(50) NOT NULL, "channel" character varying(20) NOT NULL, "isActive" boolean NOT NULL DEFAULT false, "priority" integer NOT NULL DEFAULT '0', "credentials" jsonb NOT NULL DEFAULT '{}', "features" jsonb NOT NULL DEFAULT '{}', "retryPolicy" jsonb NOT NULL DEFAULT '{}', "description" character varying(500), "lastTestedAt" TIMESTAMP, "lastTestSuccess" boolean NOT NULL DEFAULT true, "createdByAdminId" character varying(255), CONSTRAINT "UQ_4491c9591837d497f16c90cfaca" UNIQUE ("cityId", "providerType", "channel"), CONSTRAINT "PK_00bf1b21735102954736b29cdb8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9105acd04ca230dde61ac2d463" ON "provider_configs" ("priority") `);
        await queryRunner.query(`CREATE INDEX "IDX_68229d2c68829d23677341fbfb" ON "provider_configs" ("cityId", "providerType", "isActive") `);
        await queryRunner.query(`CREATE TABLE "provider_capabilities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "providerType" character varying(50) NOT NULL, "channel" character varying(30) NOT NULL, "supportsOtp" boolean NOT NULL DEFAULT false, "supportsMagicLink" boolean NOT NULL DEFAULT false, "supportsWhatsApp" boolean NOT NULL DEFAULT false, "supportsWebhook" boolean NOT NULL DEFAULT false, "supportsAutomation" boolean NOT NULL DEFAULT false, "metadata" jsonb DEFAULT '{}', CONSTRAINT "PK_f091e699c13c6f8fed4ecad165e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f4d7777a029f2a9a27ebf8f8e5" ON "provider_capabilities" ("providerType", "channel") `);
        await queryRunner.query(`CREATE TABLE "city_provider_mappings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "cityId" uuid, "moduleName" character varying(50), "channel" character varying(30) NOT NULL, "providerConfigId" uuid NOT NULL, "isPrimary" boolean NOT NULL DEFAULT true, "isFallback" boolean NOT NULL DEFAULT false, "priority" integer NOT NULL DEFAULT '0', "metadata" jsonb DEFAULT '{}', CONSTRAINT "UQ_f9044ae75f1d5896a29dddbcae3" UNIQUE ("cityId", "channel", "moduleName"), CONSTRAINT "PK_0947b5be2599ffb5cb20ab57d3c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bdf505177df53361da35cc8dd3" ON "city_provider_mappings" ("providerConfigId") `);
        await queryRunner.query(`CREATE INDEX "IDX_7cfb46a7a91835b8da4bb4abef" ON "city_provider_mappings" ("cityId", "channel") `);
        await queryRunner.query(`CREATE TYPE "public"."otp_tokens_status_enum" AS ENUM('pending', 'verified', 'expired', 'failed')`);
        await queryRunner.query(`CREATE TABLE "otp_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "phoneNumber" character varying(20), "email" character varying(255), "otpHash" character varying(255) NOT NULL, "otpToken" character varying(255) NOT NULL, "status" "public"."otp_tokens_status_enum" NOT NULL DEFAULT 'pending', "attempts" integer NOT NULL DEFAULT '0', "channel" character varying(20) NOT NULL DEFAULT 'sms', "expiresAt" TIMESTAMP NOT NULL, "verifiedAt" TIMESTAMP, "ipAddress" character varying(45), "metadata" jsonb DEFAULT '{}', CONSTRAINT "PK_424fa4c4152eafc0b2d929e138d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9673cd03cced7def663d330644" ON "otp_tokens" ("expiresAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_b433a0bc1cc46f3f4bc96a973b" ON "otp_tokens" ("email", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_de5db14337d7430ae9b9077103" ON "otp_tokens" ("phoneNumber", "status") `);
        await queryRunner.query(`CREATE TYPE "public"."magic_links_status_enum" AS ENUM('active', 'used', 'expired', 'revoked')`);
        await queryRunner.query(`CREATE TABLE "magic_links" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "email" character varying(255) NOT NULL, "token" character varying(255) NOT NULL, "tokenReference" character varying(255) NOT NULL, "status" "public"."magic_links_status_enum" NOT NULL DEFAULT 'active', "expiresAt" TIMESTAMP NOT NULL, "usedAt" TIMESTAMP, "userId" character varying(255), "ipAddress" character varying(45), "metadata" jsonb DEFAULT '{}', CONSTRAINT "PK_6c609d48037f164e7ae5b744b18" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_49b14f2f038a594ae26521cdad" ON "magic_links" ("expiresAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_032811863e2f87b7ea5ac32bbe" ON "magic_links" ("token") `);
        await queryRunner.query(`CREATE INDEX "IDX_f78d599b5fc6fbcfe3aef1557e" ON "magic_links" ("email", "status") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_f78d599b5fc6fbcfe3aef1557e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_032811863e2f87b7ea5ac32bbe"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_49b14f2f038a594ae26521cdad"`);
        await queryRunner.query(`DROP TABLE "magic_links"`);
        await queryRunner.query(`DROP TYPE "public"."magic_links_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_de5db14337d7430ae9b9077103"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b433a0bc1cc46f3f4bc96a973b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9673cd03cced7def663d330644"`);
        await queryRunner.query(`DROP TABLE "otp_tokens"`);
        await queryRunner.query(`DROP TYPE "public"."otp_tokens_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7cfb46a7a91835b8da4bb4abef"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bdf505177df53361da35cc8dd3"`);
        await queryRunner.query(`DROP TABLE "city_provider_mappings"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f4d7777a029f2a9a27ebf8f8e5"`);
        await queryRunner.query(`DROP TABLE "provider_capabilities"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_68229d2c68829d23677341fbfb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9105acd04ca230dde61ac2d463"`);
        await queryRunner.query(`DROP TABLE "provider_configs"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e15354b3ebf82f853526bebaf9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5cda7122f89b168c81121b133a"`);
        await queryRunner.query(`DROP TABLE "provider_routing_rules"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_13c69424c440a0e765053feb4b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cee5459245f652b75eb2759b4c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cfa83f61e4d27a87fcae1e025a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c69efb19bf127c97e6740ad530"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dded90d01882da143ef72396cd"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ace513fa30d485cfd25c11a9e4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_204e9b624861ff4a5b26819210"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}

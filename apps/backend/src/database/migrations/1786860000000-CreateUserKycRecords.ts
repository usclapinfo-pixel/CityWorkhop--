import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserKycRecords1786860000000 implements MigrationInterface {
  name = 'CreateUserKycRecords1786860000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."user_kyc_records_documenttype_enum" AS ENUM('PAN', 'VOTER_ID', 'SELFIE')`);
    await queryRunner.query(`CREATE TYPE "public"."user_kyc_records_submissionstatus_enum" AS ENUM('SUBMITTED', 'UNDER_REVIEW', 'COMPLETED')`);
    await queryRunner.query(`CREATE TYPE "public"."user_kyc_records_verificationstatus_enum" AS ENUM('PENDING', 'VERIFIED', 'REJECTED', 'CORRECTION_REQUIRED')`);
    await queryRunner.query(`CREATE TABLE "user_kyc_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "userId" uuid NOT NULL, "documentType" "public"."user_kyc_records_documenttype_enum" NOT NULL, "storageReference" character varying(1000) NOT NULL, "documentMetadata" jsonb DEFAULT '{}', "submissionStatus" "public"."user_kyc_records_submissionstatus_enum" NOT NULL DEFAULT 'SUBMITTED', "verificationStatus" "public"."user_kyc_records_verificationstatus_enum" NOT NULL DEFAULT 'PENDING', "verifiedBy" uuid, "verifiedAt" TIMESTAMP WITH TIME ZONE, "rejectionReason" character varying(1000), CONSTRAINT "PK_user_kyc_records_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_user_kyc_records_user_document" UNIQUE ("userId", "documentType"), CONSTRAINT "FK_user_kyc_records_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE, CONSTRAINT "FK_user_kyc_records_verified_by" FOREIGN KEY ("verifiedBy") REFERENCES "users"("id") ON DELETE SET NULL)`);
    await queryRunner.query(`CREATE INDEX "IDX_user_kyc_records_user_submission" ON "user_kyc_records" ("userId", "submissionStatus")`);
    await queryRunner.query(`CREATE INDEX "IDX_user_kyc_records_verification" ON "user_kyc_records" ("verificationStatus")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_user_kyc_records_verification"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_user_kyc_records_user_submission"`);
    await queryRunner.query(`DROP TABLE "user_kyc_records"`);
    await queryRunner.query(`DROP TYPE "public"."user_kyc_records_verificationstatus_enum"`);
    await queryRunner.query(`DROP TYPE "public"."user_kyc_records_submissionstatus_enum"`);
    await queryRunner.query(`DROP TYPE "public"."user_kyc_records_documenttype_enum"`);
  }
}

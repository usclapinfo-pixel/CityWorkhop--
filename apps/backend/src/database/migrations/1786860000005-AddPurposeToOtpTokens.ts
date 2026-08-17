import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPurposeToOtpTokens1786860000005 implements MigrationInterface {
  name = 'AddPurposeToOtpTokens1786860000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."otp_tokens_purpose_enum"
      AS ENUM('REGISTRATION', 'LOGIN')
    `);

    await queryRunner.query(`
      ALTER TABLE "otp_tokens"
      ADD "purpose" "public"."otp_tokens_purpose_enum"
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_otp_tokens_phone_purpose_status"
      ON "otp_tokens" ("phoneNumber", "purpose", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_otp_tokens_email_purpose_status"
      ON "otp_tokens" ("email", "purpose", "status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."IDX_otp_tokens_email_purpose_status"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IDX_otp_tokens_phone_purpose_status"
    `);

    await queryRunner.query(`
      ALTER TABLE "otp_tokens"
      DROP COLUMN "purpose"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."otp_tokens_purpose_enum"
    `);
  }
}

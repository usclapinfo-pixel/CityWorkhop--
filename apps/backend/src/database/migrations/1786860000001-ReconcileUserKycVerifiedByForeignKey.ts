import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReconcileUserKycVerifiedByForeignKey1786860000001 implements MigrationInterface {
  name = 'ReconcileUserKycVerifiedByForeignKey1786860000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_kyc_records" ADD CONSTRAINT "FK_user_kyc_records_verified_by" FOREIGN KEY ("verifiedBy") REFERENCES "users"("id") ON DELETE SET NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_kyc_records" DROP CONSTRAINT "FK_user_kyc_records_verified_by"`);
  }
}

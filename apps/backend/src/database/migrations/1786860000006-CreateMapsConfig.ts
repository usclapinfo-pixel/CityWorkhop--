import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMapsConfig1786860000006 implements MigrationInterface {
  name = 'CreateMapsConfig1786860000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."maps_config_provider_enum"
      AS ENUM('mock', 'google')
    `);

    await queryRunner.query(`
      CREATE TABLE "maps_config" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "provider" "public"."maps_config_provider_enum" NOT NULL DEFAULT 'mock',
        "isActive" boolean NOT NULL DEFAULT true,
        "browserApiKey" text,
        "routesApiKey" text,
        "mapId" character varying(255),
        "updatedBy" uuid,
        CONSTRAINT "PK_maps_config_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_maps_config_is_active"
      ON "maps_config" ("isActive")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."IDX_maps_config_is_active"
    `);

    await queryRunner.query(`
      DROP TABLE "maps_config"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."maps_config_provider_enum"
    `);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCities1786860000002 implements MigrationInterface {
  name = 'CreateCities1786860000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "cities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "name" character varying(255) NOT NULL, "state" character varying(255) NOT NULL, "district" character varying(255) NOT NULL, "code" character varying(100) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_cities_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_cities_code" UNIQUE ("code"))`);
    await queryRunner.query(`CREATE INDEX "IDX_cities_is_active" ON "cities" ("isActive")`);
    await queryRunner.query(`CREATE INDEX "IDX_cities_state_district" ON "cities" ("state", "district")`);

    await queryRunner.query(`DO $$ BEGIN IF EXISTS (SELECT 1 FROM "users" WHERE "defaultCityId" IS NOT NULL) THEN RAISE EXCEPTION 'Cannot add users.defaultCityId foreign key: orphan city references exist'; END IF; END $$`);
    await queryRunner.query(`DO $$ BEGIN IF EXISTS (SELECT 1 FROM "provider_configs" WHERE "cityId" IS NOT NULL) THEN RAISE EXCEPTION 'Cannot add provider_configs.cityId foreign key: orphan city references exist'; END IF; END $$`);
    await queryRunner.query(`DO $$ BEGIN IF EXISTS (SELECT 1 FROM "city_provider_mappings" WHERE "cityId" IS NOT NULL) THEN RAISE EXCEPTION 'Cannot add city_provider_mappings.cityId foreign key: orphan city references exist'; END IF; END $$`);
    await queryRunner.query(`DO $$ BEGIN IF EXISTS (SELECT 1 FROM "provider_routing_rules" WHERE "cityId" IS NOT NULL) THEN RAISE EXCEPTION 'Cannot add provider_routing_rules.cityId foreign key: orphan city references exist'; END IF; END $$`);

    await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_default_city" FOREIGN KEY ("defaultCityId") REFERENCES "cities"("id") ON DELETE RESTRICT`);
    await queryRunner.query(`ALTER TABLE "provider_configs" ADD CONSTRAINT "FK_provider_configs_city" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT`);
    await queryRunner.query(`ALTER TABLE "city_provider_mappings" ADD CONSTRAINT "FK_city_provider_mappings_city" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT`);
    await queryRunner.query(`ALTER TABLE "provider_routing_rules" ADD CONSTRAINT "FK_provider_routing_rules_city" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "provider_routing_rules" DROP CONSTRAINT "FK_provider_routing_rules_city"`);
    await queryRunner.query(`ALTER TABLE "city_provider_mappings" DROP CONSTRAINT "FK_city_provider_mappings_city"`);
    await queryRunner.query(`ALTER TABLE "provider_configs" DROP CONSTRAINT "FK_provider_configs_city"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_default_city"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cities_state_district"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cities_is_active"`);
    await queryRunner.query(`DROP TABLE "cities"`);
  }
}

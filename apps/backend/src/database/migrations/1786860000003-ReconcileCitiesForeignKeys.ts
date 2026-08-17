import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReconcileCitiesForeignKeys1786860000003 implements MigrationInterface {
  name = 'ReconcileCitiesForeignKeys1786860000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DO $$
      DECLARE orphan_count integer;
      BEGIN
        SELECT COUNT(*) INTO orphan_count
        FROM "users" u
        WHERE u."defaultCityId" IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM "cities" c WHERE c."id" = u."defaultCityId"
          );
        IF orphan_count > 0 THEN
          RAISE EXCEPTION 'Cannot add FK_users_default_city: % orphan city references found', orphan_count;
        END IF;
      END $$`);
    await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_default_city" FOREIGN KEY ("defaultCityId") REFERENCES "cities"("id") ON DELETE RESTRICT`);

    await queryRunner.query(`DO $$
      DECLARE orphan_count integer;
      BEGIN
        SELECT COUNT(*) INTO orphan_count
        FROM "provider_configs" p
        WHERE p."cityId" IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM "cities" c WHERE c."id" = p."cityId"
          );
        IF orphan_count > 0 THEN
          RAISE EXCEPTION 'Cannot add FK_provider_configs_city: % orphan city references found', orphan_count;
        END IF;
      END $$`);
    await queryRunner.query(`ALTER TABLE "provider_configs" ADD CONSTRAINT "FK_provider_configs_city" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT`);

    await queryRunner.query(`DO $$
      DECLARE orphan_count integer;
      BEGIN
        SELECT COUNT(*) INTO orphan_count
        FROM "city_provider_mappings" m
        WHERE m."cityId" IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM "cities" c WHERE c."id" = m."cityId"
          );
        IF orphan_count > 0 THEN
          RAISE EXCEPTION 'Cannot add FK_city_provider_mappings_city: % orphan city references found', orphan_count;
        END IF;
      END $$`);
    await queryRunner.query(`ALTER TABLE "city_provider_mappings" ADD CONSTRAINT "FK_city_provider_mappings_city" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT`);

    await queryRunner.query(`DO $$
      DECLARE orphan_count integer;
      BEGIN
        SELECT COUNT(*) INTO orphan_count
        FROM "provider_routing_rules" r
        WHERE r."cityId" IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM "cities" c WHERE c."id" = r."cityId"
          );
        IF orphan_count > 0 THEN
          RAISE EXCEPTION 'Cannot add FK_provider_routing_rules_city: % orphan city references found', orphan_count;
        END IF;
      END $$`);
    await queryRunner.query(`ALTER TABLE "provider_routing_rules" ADD CONSTRAINT "FK_provider_routing_rules_city" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "provider_routing_rules" DROP CONSTRAINT "FK_provider_routing_rules_city"`);
    await queryRunner.query(`ALTER TABLE "city_provider_mappings" DROP CONSTRAINT "FK_city_provider_mappings_city"`);
    await queryRunner.query(`ALTER TABLE "provider_configs" DROP CONSTRAINT "FK_provider_configs_city"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_default_city"`);
  }
}

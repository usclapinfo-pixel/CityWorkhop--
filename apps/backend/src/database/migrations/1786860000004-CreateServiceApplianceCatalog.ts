import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateServiceApplianceCatalog1786860000004 implements MigrationInterface {
  name = 'CreateServiceApplianceCatalog1786860000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "appliance_types" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "name" character varying(255) NOT NULL, "code" character varying(100) NOT NULL, "category" character varying(100), "iconReference" character varying(500), "isActive" boolean NOT NULL DEFAULT true, "displayOrder" integer NOT NULL DEFAULT 0, CONSTRAINT "PK_appliance_types_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_appliance_types_code" UNIQUE ("code"))`);
    await queryRunner.query(`CREATE INDEX "IDX_appliance_types_active" ON "appliance_types" ("isActive")`);
    await queryRunner.query(`CREATE INDEX "IDX_appliance_types_order" ON "appliance_types" ("displayOrder")`);
    await queryRunner.query(`CREATE TABLE "service_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "name" character varying(255) NOT NULL, "code" character varying(100) NOT NULL, "description" text, "isActive" boolean NOT NULL DEFAULT true, "displayOrder" integer NOT NULL DEFAULT 0, CONSTRAINT "PK_service_categories_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_service_categories_code" UNIQUE ("code"))`);
    await queryRunner.query(`CREATE INDEX "IDX_service_categories_active" ON "service_categories" ("isActive")`);
    await queryRunner.query(`CREATE INDEX "IDX_service_categories_order" ON "service_categories" ("displayOrder")`);
    await queryRunner.query(`CREATE TABLE "service_offerings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "serviceCategoryId" uuid NOT NULL, "applianceTypeId" uuid NOT NULL, "name" character varying(255) NOT NULL, "code" character varying(100) NOT NULL, "description" text, "requiresInspection" boolean NOT NULL DEFAULT true, "estimatedDurationMinutes" integer, "isActive" boolean NOT NULL DEFAULT true, "displayOrder" integer NOT NULL DEFAULT 0, CONSTRAINT "PK_service_offerings_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_service_offerings_code" UNIQUE ("code"), CONSTRAINT "FK_service_offerings_category" FOREIGN KEY ("serviceCategoryId") REFERENCES "service_categories"("id") ON DELETE RESTRICT, CONSTRAINT "FK_service_offerings_appliance" FOREIGN KEY ("applianceTypeId") REFERENCES "appliance_types"("id") ON DELETE RESTRICT)`);
    await queryRunner.query(`CREATE INDEX "IDX_service_offerings_category_active" ON "service_offerings" ("serviceCategoryId", "isActive")`);
    await queryRunner.query(`CREATE INDEX "IDX_service_offerings_appliance_active" ON "service_offerings" ("applianceTypeId", "isActive")`);
    await queryRunner.query(`CREATE INDEX "IDX_service_offerings_order" ON "service_offerings" ("displayOrder")`);
    await queryRunner.query(`CREATE TABLE "city_service_offerings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "cityId" uuid NOT NULL, "serviceOfferingId" uuid NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "displayOrder" integer NOT NULL DEFAULT 0, CONSTRAINT "PK_city_service_offerings_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_city_service_offerings_city_service" UNIQUE ("cityId", "serviceOfferingId"), CONSTRAINT "FK_city_service_offerings_city" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT, CONSTRAINT "FK_city_service_offerings_service" FOREIGN KEY ("serviceOfferingId") REFERENCES "service_offerings"("id") ON DELETE RESTRICT)`);
    await queryRunner.query(`CREATE INDEX "IDX_city_service_offerings_city_active" ON "city_service_offerings" ("cityId", "isActive")`);
    await queryRunner.query(`CREATE INDEX "IDX_city_service_offerings_service_active" ON "city_service_offerings" ("serviceOfferingId", "isActive")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_city_service_offerings_service_active"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_city_service_offerings_city_active"`);
    await queryRunner.query(`DROP TABLE "city_service_offerings"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_service_offerings_order"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_service_offerings_appliance_active"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_service_offerings_category_active"`);
    await queryRunner.query(`DROP TABLE "service_offerings"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_service_categories_order"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_service_categories_active"`);
    await queryRunner.query(`DROP TABLE "service_categories"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_appliance_types_order"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_appliance_types_active"`);
    await queryRunner.query(`DROP TABLE "appliance_types"`);
  }
}

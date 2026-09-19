import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSoftDeleteColumns1784461929867 implements MigrationInterface {
    name = 'AddSoftDeleteColumns1784461929867'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_images" DROP CONSTRAINT "FK_product_images_variant"`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "is_deleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "is_deleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "product_categories" ADD "is_deleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "product_images" ADD "is_deleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "products" ADD "is_deleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "customer_addresses" ADD "is_deleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "customer_tags" ADD "is_deleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "is_deleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "coupons" ADD "is_deleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "stores" ADD "is_deleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "product_variants" ADD "is_deleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "materials" ADD "is_deleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "material_purchases" ADD "is_deleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "suppliers" ADD "is_deleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD "is_deleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "expenses" ADD "is_deleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "hero_media" ADD "is_deleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "hero_sections" ADD "is_deleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "is_deleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "charge" ADD "is_deleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "product_images" ADD CONSTRAINT "FK_7645bd68229997627f7b2191687" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_images" DROP CONSTRAINT "FK_7645bd68229997627f7b2191687"`);
        await queryRunner.query(`ALTER TABLE "charge" DROP COLUMN "is_deleted"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "is_deleted"`);
        await queryRunner.query(`ALTER TABLE "hero_sections" DROP COLUMN "is_deleted"`);
        await queryRunner.query(`ALTER TABLE "hero_media" DROP COLUMN "is_deleted"`);
        await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "is_deleted"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP COLUMN "is_deleted"`);
        await queryRunner.query(`ALTER TABLE "suppliers" DROP COLUMN "is_deleted"`);
        await queryRunner.query(`ALTER TABLE "material_purchases" DROP COLUMN "is_deleted"`);
        await queryRunner.query(`ALTER TABLE "materials" DROP COLUMN "is_deleted"`);
        await queryRunner.query(`ALTER TABLE "product_variants" DROP COLUMN "is_deleted"`);
        await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "is_deleted"`);
        await queryRunner.query(`ALTER TABLE "coupons" DROP COLUMN "is_deleted"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "is_deleted"`);
        await queryRunner.query(`ALTER TABLE "customer_tags" DROP COLUMN "is_deleted"`);
        await queryRunner.query(`ALTER TABLE "customer_addresses" DROP COLUMN "is_deleted"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "is_deleted"`);
        await queryRunner.query(`ALTER TABLE "product_images" DROP COLUMN "is_deleted"`);
        await queryRunner.query(`ALTER TABLE "product_categories" DROP COLUMN "is_deleted"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_deleted"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "is_deleted"`);
        await queryRunner.query(`ALTER TABLE "product_images" ADD CONSTRAINT "FK_product_images_variant" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}

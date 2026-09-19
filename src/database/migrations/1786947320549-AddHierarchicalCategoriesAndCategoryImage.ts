import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHierarchicalCategoriesAndCategoryImage1786947320549 implements MigrationInterface {
    name = 'AddHierarchicalCategoriesAndCategoryImage1786947320549'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "category_images" ("id" BIGSERIAL NOT NULL, "category_id" bigint NOT NULL, "image_url" text NOT NULL, "is_primary" boolean NOT NULL DEFAULT false, "status" character varying(20) NOT NULL DEFAULT 'active', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fd32228261460eca2567579ec42" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "product_categories" ADD "parent_id" bigint`);
        await queryRunner.query(`ALTER TABLE "product_categories" ADD "image_url" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "category_images" ADD CONSTRAINT "FK_59ed1b18d3a243accc6d0003ac4" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_categories" ADD CONSTRAINT "FK_5f151d414daab0290f65b517ed4" FOREIGN KEY ("parent_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_categories" DROP CONSTRAINT "FK_5f151d414daab0290f65b517ed4"`);
        await queryRunner.query(`ALTER TABLE "category_images" DROP CONSTRAINT "FK_59ed1b18d3a243accc6d0003ac4"`);
        await queryRunner.query(`ALTER TABLE "product_categories" DROP COLUMN "image_url"`);
        await queryRunner.query(`ALTER TABLE "product_categories" DROP COLUMN "parent_id"`);
        await queryRunner.query(`DROP TABLE "category_images"`);
    }

}

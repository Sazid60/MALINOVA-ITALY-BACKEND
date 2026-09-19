import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVariantIdToProductImages1784440500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "product_images" ADD COLUMN "variant_id" BIGINT;
      ALTER TABLE "product_images" ADD CONSTRAINT "FK_product_images_variant"
        FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "product_images" DROP CONSTRAINT "FK_product_images_variant";
      ALTER TABLE "product_images" DROP COLUMN "variant_id";
    `);
  }
}

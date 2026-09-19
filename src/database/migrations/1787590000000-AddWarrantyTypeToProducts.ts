import { MigrationInterface, QueryRunner } from 'typeorm';

/** Formal migration for warranty_type column on products (previously added via runtime ALTER) */
export class AddWarrantyTypeToProducts1787590000000 implements MigrationInterface {
  name = 'AddWarrantyTypeToProducts1787590000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "warranty_type" VARCHAR(50) DEFAULT 'official'`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "warranty_type"`);
  }
}

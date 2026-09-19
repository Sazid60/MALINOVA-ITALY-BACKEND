import { MigrationInterface, QueryRunner } from 'typeorm';

/** Remove legacy single-warranty columns from products (superseded by product_warranty_policies components). */
export class RemoveSingleWarrantyFromProducts1787950000000
  implements MigrationInterface
{
  name = 'RemoveSingleWarrantyFromProducts1787950000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE products DROP COLUMN IF EXISTS warranty_months`,
    );
    await queryRunner.query(
      `ALTER TABLE products DROP COLUMN IF EXISTS warranty_type`,
    );
    await queryRunner.query(
      `ALTER TABLE products DROP COLUMN IF EXISTS warranty_note`,
    );
    await queryRunner.query(
      `ALTER TABLE products DROP COLUMN IF EXISTS warranty_optional`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE products ADD COLUMN warranty_months integer NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE products ADD COLUMN warranty_type varchar(50) NULL DEFAULT 'official'`,
    );
    await queryRunner.query(
      `ALTER TABLE products ADD COLUMN warranty_note text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE products ADD COLUMN warranty_optional boolean NOT NULL DEFAULT false`,
    );
  }
}
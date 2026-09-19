import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Re-add production/expiry dates to product_batches.
 * Dropped in MigrateToElectronicsRetail; expiry is now a WARNING,
 * not a hard stop — the batch stays sellable after expiry_date passes.
 */
export class AddBatchExpiryDates1788100000000 implements MigrationInterface {
  name = 'AddBatchExpiryDates1788100000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE product_batches ADD COLUMN IF NOT EXISTS production_date date NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE product_batches ADD COLUMN IF NOT EXISTS expiry_date date NULL`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE product_batches DROP COLUMN IF EXISTS expiry_date`,
    );
    await queryRunner.query(
      `ALTER TABLE product_batches DROP COLUMN IF EXISTS production_date`,
    );
  }
}
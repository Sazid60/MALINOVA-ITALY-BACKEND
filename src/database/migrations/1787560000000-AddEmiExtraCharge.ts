import { MigrationInterface, QueryRunner } from 'typeorm';

/** Extra charge added to an order when EMI tenure is selected */
export class AddEmiExtraCharge1787560000000 implements MigrationInterface {
  name = 'AddEmiExtraCharge1787560000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS emi_extra_charge numeric(12,2) NOT NULL DEFAULT 0`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE orders DROP COLUMN IF EXISTS emi_extra_charge`);
  }
}

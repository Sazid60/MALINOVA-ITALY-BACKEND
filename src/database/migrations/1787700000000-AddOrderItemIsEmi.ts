import { MigrationInterface, QueryRunner } from 'typeorm';

/** Marks each order line as EMI-financed (true) or paid directly (false).
 *  Enables mixed EMI + cash items within a single order. */
export class AddOrderItemIsEmi1787700000000 implements MigrationInterface {
  name = 'AddOrderItemIsEmi1787700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE order_items
      ADD COLUMN IF NOT EXISTS is_emi boolean NOT NULL DEFAULT false`);
    // Backfill existing EMI orders: every line of an EMI-financed order is EMI.
    await queryRunner.query(
      `UPDATE order_items SET is_emi = true
         FROM orders
        WHERE orders.id = order_items.order_id
          AND orders.emi_tenure_months IS NOT NULL`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE order_items DROP COLUMN IF EXISTS is_emi`);
  }
}

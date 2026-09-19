import { MigrationInterface, QueryRunner } from 'typeorm';

/** Stores the unit weight (grams) agreed for each order line at order time.
 *  Allows admin to enter/override weight while creating an order (online or offline)
 *  and keeps per-item weight displayable on the order. */
export class AddOrderItemWeight1787800000000 implements MigrationInterface {
  name = 'AddOrderItemWeight1787800000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE order_items
      ADD COLUMN IF NOT EXISTS weight_grams numeric(10,2) NULL`);
    // Backfill per-line weight from the order total where possible (single-item orders)
    await queryRunner.query(
      `UPDATE order_items oi
          SET weight_grams = CASE WHEN oi.quantity > 0
             THEN ROUND((o.total_weight_gm::numeric / oi.quantity), 2)
             ELSE NULL END
         FROM orders o
        WHERE o.id = oi.order_id
          AND o.total_weight_gm > 0
          AND oi.weight_grams IS NULL`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE order_items DROP COLUMN IF EXISTS weight_grams`);
  }
}
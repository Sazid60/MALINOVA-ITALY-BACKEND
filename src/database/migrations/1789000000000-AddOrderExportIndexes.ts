import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Indexes to keep order-list & export queries fast:
 *  - created_at: date-range filter (export + table)
 *  - status / return_status: status + "sold/delivered/returned" branches
 * The keyset export cursor already rides the PRIMARY KEY (o.id).
 */
export class AddOrderExportIndexes1789000000000 implements MigrationInterface {
  name = 'AddOrderExportIndexes1789000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_orders_return_status ON orders(return_status)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_created_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_return_status`);
  }
}
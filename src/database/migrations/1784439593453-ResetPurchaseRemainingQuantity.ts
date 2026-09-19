import { MigrationInterface, QueryRunner } from 'typeorm';

export class ResetPurchaseRemainingQuantity1784439593453 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Reset quantity_remaining back to quantity for all purchase entries.
    // This corrects data corrupted by the old buggy revert logic in setProductMaterialUsage
    // which was incorrectly adding back stock from previous batch usages on every save.
    await queryRunner.query(`
      UPDATE material_purchases
      SET quantity_remaining = quantity
    `);

    // Also clear total_quantity_used and purchase_id on all usage records so the slate is clean
    await queryRunner.query(`
      UPDATE product_material_usage
      SET total_quantity_used = 0, purchase_id = NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No meaningful rollback for a data reset
  }
}

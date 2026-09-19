import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Move EMI operational permissions from module 'orders' to dedicated 'emi' module
 * so they appear as a distinct group in the permissions UI and role editor.
 */
export class MoveEmiPermissionsToOwnModule1788200000000 implements MigrationInterface {
  name = 'MoveEmiPermissionsToOwnModule1788200000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE permissions
      SET module = 'emi'
      WHERE code IN ('emi.emi.view', 'emi.emi.manage')
        AND module = 'orders'
    `);

    // Also fix the original seed migration's module if it was applied
    await queryRunner.query(`
      INSERT INTO permissions (code, description, module)
      SELECT 'emi.emi.view', 'View EMI ledger and installment schedules', 'emi'
      WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'emi.emi.view')
    `);
    await queryRunner.query(`
      INSERT INTO permissions (code, description, module)
      SELECT 'emi.emi.manage', 'Collect/reverse installments and send EMI reminders', 'emi'
      WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'emi.emi.manage')
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE permissions
      SET module = 'orders'
      WHERE code IN ('emi.emi.view', 'emi.emi.manage')
        AND module = 'emi'
    `);
  }
}

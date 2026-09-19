import { MigrationInterface, QueryRunner } from 'typeorm';

/** Dedicated EMI operational permissions (ledger view + installment collection) */
export class AddEmiPermissions1787580000000 implements MigrationInterface {
  name = 'AddEmiPermissions1787580000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Insert-if-missing the two EMI operational permissions (module: orders)
    await queryRunner.query(`
      INSERT INTO permissions (code, description, module)
      SELECT 'emi.emi.view', 'View EMI ledger, financed orders and installment schedules', 'orders'
      WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'emi.emi.view')
    `);
    await queryRunner.query(`
      INSERT INTO permissions (code, description, module)
      SELECT 'emi.emi.manage', 'Collect/reverse installments and send EMI reminders', 'orders'
      WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'emi.emi.manage')
    `);

    // Map to roles following the same rules as seeds/admin-seed.helper.ts:
    //   owner → all | manager → all (except settings.*) | sales_agent → orders.* + emi.*
    //   warehouse_staff → none | viewer → *.view only
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r
      CROSS JOIN permissions p
      WHERE p.code IN ('emi.emi.view', 'emi.emi.manage')
        AND r.name IN ('owner', 'manager', 'sales_agent')
        AND NOT EXISTS (
          SELECT 1 FROM role_permissions rp
          WHERE rp.role_id = r.id AND rp.permission_id = p.id
        )
    `);
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r
      CROSS JOIN permissions p
      WHERE p.code = 'emi.emi.view'
        AND r.name = 'viewer'
        AND NOT EXISTS (
          SELECT 1 FROM role_permissions rp
          WHERE rp.role_id = r.id AND rp.permission_id = p.id
        )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM role_permissions
      WHERE permission_id IN (SELECT id FROM permissions WHERE code IN ('emi.emi.view', 'emi.emi.manage'))
    `);
    await queryRunner.query(`
      DELETE FROM permissions WHERE code IN ('emi.emi.view', 'emi.emi.manage')
    `);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

/** Servicing + Warranty operational permissions + role mapping */
export class AddServicingWarrantyPermissions1787900000001 implements MigrationInterface {
  name = 'AddServicingWarrantyPermissions1787900000001';

  private readonly servicingPermissions = [
    { code: 'servicing.view', desc: 'View servicing jobs + serial search', module: 'servicing' },
    { code: 'servicing.manage', desc: 'Create/update jobs, advance stepper, add parts', module: 'servicing' },
    { code: 'servicing.quote', desc: 'Build/approve quotes, send quote SMS', module: 'servicing' },
    { code: 'servicing.charge', desc: 'Apply/correct charges, deposits, refunds', module: 'servicing' },
    { code: 'servicing.settings.view', desc: 'View servicing settings', module: 'servicing' },
    { code: 'servicing.settings.manage', desc: 'Edit servicing charge/OTP config', module: 'servicing' },
    { code: 'servicing.otp.verify', desc: 'Send + verify OTP, manual counter-verify override', module: 'servicing' },
  ];

  private readonly warrantyPermissions = [
    { code: 'warranty.policy.view', desc: 'View warranty policies', module: 'warranty' },
    { code: 'warranty.policy.manage', desc: 'Create/edit warranty policies & coverage', module: 'warranty' },
    { code: 'warranty.registration.view', desc: 'List/search warranty registrations', module: 'warranty' },
    { code: 'warranty.registration.manage', desc: 'Extend/void/transfer warranty registrations', module: 'warranty' },
  ];

  async up(queryRunner: QueryRunner): Promise<void> {
    const all = [...this.servicingPermissions, ...this.warrantyPermissions];
    for (const p of all) {
      await queryRunner.query(`
        INSERT INTO permissions (code, description, module)
        SELECT '${p.code}', '${p.desc}', '${p.module}'
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = '${p.code}')
      `);
    }

    const codes = all.map((p) => `'${p.code}'`).join(', ');

    // owner -> gateway to all servicing + warranty permissions
    // manager -> all EXCEPT servicing.settings.manage
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r CROSS JOIN permissions p
      WHERE p.code IN (${codes})
        AND r.name IN ('owner','manager')
        AND NOT (r.name = 'manager' AND p.code = 'servicing.settings.manage')
        AND NOT EXISTS (SELECT 1 FROM role_permissions rp
          WHERE rp.role_id = r.id AND rp.permission_id = p.id)
    `);

    // sales_agent -> servicing.view/manage/otp.verify + warranty.registration.view
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
      WHERE p.code IN (
        'servicing.view','servicing.manage','servicing.otp.verify','warranty.registration.view'
      ) AND r.name = 'sales_agent'
        AND NOT EXISTS (SELECT 1 FROM role_permissions rp
          WHERE rp.role_id = r.id AND rp.permission_id = p.id)
    `);

    // viewer -> view-only
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
      WHERE p.code IN (
        'servicing.view','servicing.settings.view','warranty.policy.view','warranty.registration.view'
      ) AND r.name = 'viewer'
        AND NOT EXISTS (SELECT 1 FROM role_permissions rp
          WHERE rp.role_id = r.id AND rp.permission_id = p.id)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const all = [...this.servicingPermissions, ...this.warrantyPermissions];
    const codes = all.map((p) => `'${p.code}'`).join(', ');
    await queryRunner.query(`
      DELETE FROM role_permissions
      WHERE permission_id IN (SELECT id FROM permissions WHERE code IN (${codes}))
    `);
    await queryRunner.query(`
      DELETE FROM permissions WHERE code IN (${codes})
    `);
  }
}

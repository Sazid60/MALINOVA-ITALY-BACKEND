import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Consolidate servicing permissions to only servicing.view + servicing.manage.
 * Removes the now-unused operational codes: servicing.quote, servicing.charge,
 * servicing.settings.view, servicing.settings.manage, servicing.otp.verify.
 */
export class ConsolidateServicingPermissions1787900000003 implements MigrationInterface {
  name = 'ConsolidateServicingPermissions1787900000003';

  private readonly orphanedCodes = [
    'servicing.quote',
    'servicing.charge',
    'servicing.settings.view',
    'servicing.settings.manage',
    'servicing.otp.verify',
  ];

  async up(queryRunner: QueryRunner): Promise<void> {
    const codes = this.orphanedCodes.map((c) => `'${c}'`).join(', ');

    await queryRunner.query(`
      DELETE FROM role_permissions
      WHERE permission_id IN (SELECT id FROM permissions WHERE code IN (${codes}))
    `);
    await queryRunner.query(`
      DELETE FROM permissions WHERE code IN (${codes})
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const seeds: { code: string; desc: string }[] = [
      { code: 'servicing.quote', desc: 'Build/approve quotes, send quote SMS' },
      { code: 'servicing.charge', desc: 'Apply/correct charges, deposits, refunds' },
      { code: 'servicing.settings.view', desc: 'View servicing settings' },
      { code: 'servicing.settings.manage', desc: 'Edit servicing charge/OTP config' },
      { code: 'servicing.otp.verify', desc: 'Send + verify OTP, manual counter-verify override' },
    ];

    for (const p of seeds) {
      await queryRunner.query(`
        INSERT INTO permissions (code, description, module)
        SELECT '${p.code}', '${p.desc}', 'servicing'
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = '${p.code}')
      `);
    }
  }
}
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Track warranty claim usage: add a configurable per-policy claim limit.
 * The actual claim count per serial is derived from service_jobs (non-cancelled)
 * at read time, so no counter column is stored here.
 */
export class AddWarrantyClaimTracking1787900000002 implements MigrationInterface {
  name = 'AddWarrantyClaimTracking1787900000002';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE warranty_policies
        ADD COLUMN IF NOT EXISTS max_claims integer NOT NULL DEFAULT 0
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE warranty_policies
        DROP COLUMN IF EXISTS max_claims
    `);
  }
}

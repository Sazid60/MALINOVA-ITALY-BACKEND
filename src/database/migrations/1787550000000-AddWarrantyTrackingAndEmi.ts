import { MigrationInterface, QueryRunner } from 'typeorm';

/** Warranty tracking on order items + EMI fields and installment schedule on orders */
export class AddWarrantyTrackingAndEmi1787550000000 implements MigrationInterface {
  name = 'AddWarrantyTrackingAndEmi1787550000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Warranty snapshot per sold line (warranty clock starts at delivery)
    await queryRunner.query(`ALTER TABLE order_items
      ADD COLUMN IF NOT EXISTS warranty_months integer NULL,
      ADD COLUMN IF NOT EXISTS warranty_start timestamptz NULL,
      ADD COLUMN IF NOT EXISTS warranty_end timestamptz NULL`);

    // EMI fields on the order
    await queryRunner.query(`ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS emi_tenure_months integer NULL,
      ADD COLUMN IF NOT EXISTS emi_down_payment numeric(12,2) NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS emi_monthly_installment numeric(12,2) NULL`)

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS emi_schedules (
      id bigserial PRIMARY KEY,
      order_id bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      installment_no integer NOT NULL,
      due_date date NOT NULL,
      amount numeric(12,2) NOT NULL,
      status varchar(20) NOT NULL DEFAULT 'pending',
      paid_at timestamptz NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT uq_emi_schedule_order_no UNIQUE (order_id, installment_no)
    )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_emi_schedules_order ON emi_schedules(order_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_emi_schedules_status ON emi_schedules(status)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS emi_schedules`);
    await queryRunner.query(`ALTER TABLE orders
      DROP COLUMN IF EXISTS emi_tenure_months,
      DROP COLUMN IF EXISTS emi_down_payment,
      DROP COLUMN IF EXISTS emi_monthly_installment`);
    await queryRunner.query(`ALTER TABLE order_items
      DROP COLUMN IF EXISTS warranty_months,
      DROP COLUMN IF EXISTS warranty_start,
      DROP COLUMN IF EXISTS warranty_end`);
  }
}

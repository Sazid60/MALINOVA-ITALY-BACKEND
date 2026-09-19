import { MigrationInterface, QueryRunner } from 'typeorm';

/** Servicing module tables: warranty policies, registrations, service jobs, OTP */
export class CreateServicingTables1787900000000 implements MigrationInterface {
  name = 'CreateServicingTables1787900000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // warranty policies (definitional tiers)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS warranty_policies (
        id bigserial PRIMARY KEY,
        name varchar(100) NOT NULL,
        code varchar(20) NOT NULL,
        labor_covered boolean NOT NULL DEFAULT false,
        parts_covered boolean NOT NULL DEFAULT false,
        duration_days integer NOT NULL DEFAULT 0,
        description text NULL,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_warranty_policies_code UNIQUE (code)
      )
    `);

    // per-product warranty override
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS product_warranty_policies (
        id bigserial PRIMARY KEY,
        product_id bigint NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        warranty_policy_id bigint NOT NULL REFERENCES warranty_policies(id) ON DELETE CASCADE,
        warranty_duration_days integer NULL,
        service_coverage boolean NULL,
        parts_coverage boolean NULL,
        customer_policy_note text NULL,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_pwp_product ON product_warranty_policies(product_id)`);

    // warranty registration per sold serial
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS product_purchase_warranties (
        id bigserial PRIMARY KEY,
        product_id bigint NOT NULL REFERENCES products(id),
        order_id bigint NULL REFERENCES orders(id),
        order_item_id bigint NULL,
        customer_id bigint NULL,
        serial_number varchar(100) NOT NULL,
        purchase_date timestamptz NULL,
        warranty_start_date timestamptz NULL,
        warranty_end_date timestamptz NULL,
        warranty_type varchar(20) NOT NULL DEFAULT 'none',
        warranty_policy_id bigint NULL REFERENCES warranty_policies(id),
        status varchar(20) NOT NULL DEFAULT 'active',
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_ppw_serial ON product_purchase_warranties(serial_number)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_ppw_order_item ON product_purchase_warranties(order_item_id)`);

    // servicing settings (singleton row)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS servicing_settings (
        id bigserial PRIMARY KEY,
        service_charge numeric(12,2) NOT NULL DEFAULT 0,
        diagnosis_fee numeric(12,2) NOT NULL DEFAULT 0,
        parts_markup_percent numeric(6,2) NOT NULL DEFAULT 0,
        vat_percent numeric(6,2) NOT NULL DEFAULT 0,
        out_of_scope_charge numeric(12,2) NOT NULL DEFAULT 0,
        otp_validity_minutes integer NOT NULL DEFAULT 5,
        otp_resend_cooldown_sec integer NOT NULL DEFAULT 60,
        otp_max_attempts integer NOT NULL DEFAULT 3,
        quote_expiry_days integer NOT NULL DEFAULT 7,
        ber_threshold_percent numeric(6,2) NOT NULL DEFAULT 50,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    // service jobs
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS service_jobs (
        id bigserial PRIMARY KEY,
        job_code varchar(50) NOT NULL,
        serial_number_id bigint NOT NULL REFERENCES product_serial_numbers(id),
        product_id bigint NOT NULL REFERENCES products(id),
        customer_id bigint NULL,
        order_id bigint NULL,
        store_id bigint NULL,
        warranty_policy_id bigint NULL REFERENCES warranty_policies(id),
        warranty_tier varchar(20) NOT NULL DEFAULT 'none',
        warranty_start_date timestamptz NULL,
        warranty_end_date timestamptz NULL,
        warranty_is_valid boolean NOT NULL DEFAULT false,
        claim_type varchar(20) NOT NULL DEFAULT 'paid_service',
        issue_description text NULL,
        failure_category varchar(100) NULL,
        diagnosis_notes text NULL,
        vendor_service_center_id bigint NULL,
        vendor_job_reference varchar(100) NULL,
        vendor_cost numeric(12,2) NOT NULL DEFAULT 0,
        status varchar(20) NOT NULL DEFAULT 'received',
        quoted_service_charge numeric(12,2) NOT NULL DEFAULT 0,
        quoted_parts_cost numeric(12,2) NOT NULL DEFAULT 0,
        quote_applied_at timestamptz NULL,
        quote_expires_at timestamptz NULL,
        quoted_total numeric(12,2) NOT NULL DEFAULT 0,
        payable_by_customer numeric(12,2) NOT NULL DEFAULT 0,
        amount_paid numeric(12,2) NOT NULL DEFAULT 0,
        deposit_paid numeric(12,2) NOT NULL DEFAULT 0,
        payment_status varchar(20) NOT NULL DEFAULT 'pending',
        is_out_of_scope boolean NOT NULL DEFAULT false,
        state_flag varchar(20) NOT NULL DEFAULT 'active',
        phone varchar(100) NULL,
        created_by bigint NULL,
        updated_by bigint NULL,
        received_at timestamptz NULL,
        expected_ready_at timestamptz NULL,
        completed_at timestamptz NULL,
        closed_at timestamptz NULL,
        version integer NOT NULL DEFAULT 1,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_service_jobs_code UNIQUE (job_code)
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_service_jobs_active_serial
      ON service_jobs(serial_number_id)
      WHERE state_flag = 'active'
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_service_jobs_status ON service_jobs(status)`);

    // service job parts
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS service_job_parts (
        id bigserial PRIMARY KEY,
        job_id bigint NOT NULL REFERENCES service_jobs(id) ON DELETE CASCADE,
        name varchar(200) NOT NULL,
        code varchar(100) NULL,
        part_cost numeric(12,2) NOT NULL DEFAULT 0,
        qty integer NOT NULL DEFAULT 1,
        is_covered_by_warranty boolean NOT NULL DEFAULT false,
        customer_price numeric(12,2) NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_sjp_job ON service_job_parts(job_id)`);

    // service job timeline (stepper / audit)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS service_job_timeline (
        id bigserial PRIMARY KEY,
        job_id bigint NOT NULL REFERENCES service_jobs(id) ON DELETE CASCADE,
        status varchar(20) NOT NULL,
        note text NULL,
        charge_delta numeric(12,2) NULL,
        updated_by bigint NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_sjt_job ON service_job_timeline(job_id)`);

    // service OTPs
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS service_otps (
        id bigserial PRIMARY KEY,
        job_id bigint NOT NULL REFERENCES service_jobs(id) ON DELETE CASCADE,
        customer_id bigint NULL,
        phone varchar(20) NOT NULL,
        otp_hash varchar(255) NOT NULL,
        salt varchar(64) NULL,
        purpose varchar(20) NOT NULL,
        expires_at timestamptz NOT NULL,
        verified_at timestamptz NULL,
        verified boolean NOT NULL DEFAULT false,
        attempt_count integer NOT NULL DEFAULT 0,
        manual boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_sotp_job ON service_otps(job_id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS service_otps`);
    await queryRunner.query(`DROP TABLE IF EXISTS service_job_timeline`);
    await queryRunner.query(`DROP TABLE IF EXISTS service_job_parts`);
    await queryRunner.query(`DROP TABLE IF EXISTS service_jobs`);
    await queryRunner.query(`DROP TABLE IF EXISTS servicing_settings`);
    await queryRunner.query(`DROP TABLE IF EXISTS product_purchase_warranties`);
    await queryRunner.query(`DROP TABLE IF EXISTS product_warranty_policies`);
    await queryRunner.query(`DROP TABLE IF EXISTS warranty_policies`);
  }
}

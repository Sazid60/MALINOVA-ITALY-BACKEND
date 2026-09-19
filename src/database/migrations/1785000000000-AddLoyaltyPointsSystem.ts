import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLoyaltyPointsSystem1785000000000 implements MigrationInterface {
  name = 'AddLoyaltyPointsSystem1785000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. loyalty_config
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "loyalty_config" (
        "id" BIGSERIAL PRIMARY KEY,
        "is_enabled" boolean NOT NULL DEFAULT false,
        "earn_rate" numeric(10,4) NOT NULL DEFAULT 1.0,
        "earn_on" varchar(20) NOT NULL DEFAULT 'subtotal',
        "min_order_for_earn" numeric(10,2) NOT NULL DEFAULT 0,
        "points_pending_days" integer NOT NULL DEFAULT 7,
        "point_value" numeric(10,4) NOT NULL DEFAULT 1.0,
        "redeem_type" varchar(20) NOT NULL DEFAULT 'fixed',
        "redeem_value" numeric(10,4) NOT NULL DEFAULT 1.0,
        "max_redeem_points_per_order" integer NOT NULL DEFAULT 500,
        "max_redeem_percent" numeric(5,2) NOT NULL DEFAULT 50.00,
        "min_points_to_redeem" integer NOT NULL DEFAULT 10,
        "cooldown_hours_redemption_fulfillment" integer NOT NULL DEFAULT 2,
        "require_admin_approval" boolean NOT NULL DEFAULT false,
        "approval_threshold_points" integer NOT NULL DEFAULT 100,
        "max_points_per_order_earn" integer NOT NULL DEFAULT 1000,
        "daily_earn_limit" integer NOT NULL DEFAULT 5000,
        "daily_redeem_limit" integer NOT NULL DEFAULT 2000,
        "cooldown_hours_after_account_change" integer NOT NULL DEFAULT 48,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );
    `);

    // 2. customer_points
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "customer_points" (
        "id" BIGSERIAL PRIMARY KEY,
        "customer_id" bigint NOT NULL,
        "order_id" bigint,
        "type" varchar(20) NOT NULL,
        "points" numeric(12,2) NOT NULL,
        "balance_after" numeric(12,2) NOT NULL,
        "description" varchar(255),
        "available_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" bigint,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "FK_customer_points_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_customer_points_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_customer_points_customer" ON "customer_points" ("customer_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_customer_points_order" ON "customer_points" ("order_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_customer_points_type" ON "customer_points" ("type");`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_customer_points_earn_idempotent"
      ON "customer_points" ("order_id", "type")
      WHERE type IN ('earned', 'pending') AND order_id IS NOT NULL;
    `);

    // 3. customer_point_balances
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "customer_point_balances" (
        "id" BIGSERIAL PRIMARY KEY,
        "customer_id" bigint NOT NULL UNIQUE,
        "total_earned" numeric(12,2) NOT NULL DEFAULT 0,
        "total_redeemed" numeric(12,2) NOT NULL DEFAULT 0,
        "total_bonus" numeric(12,2) NOT NULL DEFAULT 0,
        "available_balance" numeric(12,2) NOT NULL DEFAULT 0,
        "version" integer NOT NULL DEFAULT 0,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "FK_customer_point_balances_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE
      );
    `);

    // 4. loyalty_redemption_requests
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "loyalty_redemption_requests" (
        "id" BIGSERIAL PRIMARY KEY,
        "customer_id" bigint NOT NULL,
        "order_id" bigint,
        "points" integer NOT NULL,
        "discount_amount" numeric(10,2) NOT NULL,
        "otp_code" varchar(6),
        "otp_expires_at" TIMESTAMP WITH TIME ZONE,
        "status" varchar(20) NOT NULL DEFAULT 'pending',
        "approved_by" bigint,
        "approved_at" TIMESTAMP WITH TIME ZONE,
        "reject_reason" varchar(255),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "FK_loyalty_redemption_requests_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_loyalty_redemption_requests_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL
      );
    `);

    // 5. Add columns to orders & customers
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "points_earned" integer NOT NULL DEFAULT 0;`);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "points_redeemed" integer NOT NULL DEFAULT 0;`);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "points_discount_amount" numeric(10,2) NOT NULL DEFAULT 0;`);
    await queryRunner.query(`ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "loyalty_points_available" numeric(12,2) NOT NULL DEFAULT 0;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN IF EXISTS "loyalty_points_available";`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "points_discount_amount";`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "points_redeemed";`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "points_earned";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "loyalty_redemption_requests";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customer_point_balances";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customer_points";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "loyalty_config";`);
  }
}

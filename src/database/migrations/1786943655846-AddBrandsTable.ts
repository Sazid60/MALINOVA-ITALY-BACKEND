import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBrandsTable1786943655846 implements MigrationInterface {
    name = 'AddBrandsTable1786943655846'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification_templates" DROP CONSTRAINT "FK_notification_templates_channel"`);
        await queryRunner.query(`ALTER TABLE "notification_templates" DROP CONSTRAINT "FK_notification_templates_event"`);
        await queryRunner.query(`ALTER TABLE "loyalty_redemption_requests" DROP CONSTRAINT "FK_loyalty_redemption_requests_order"`);
        await queryRunner.query(`ALTER TABLE "loyalty_redemption_requests" DROP CONSTRAINT "FK_loyalty_redemption_requests_customer"`);
        await queryRunner.query(`ALTER TABLE "customer_points" DROP CONSTRAINT "FK_customer_points_order"`);
        await queryRunner.query(`ALTER TABLE "customer_points" DROP CONSTRAINT "FK_customer_points_customer"`);
        await queryRunner.query(`ALTER TABLE "customer_point_balances" DROP CONSTRAINT "FK_customer_point_balances_customer"`);
        await queryRunner.query(`DROP INDEX "public"."idx_notification_templates_event"`);
        await queryRunner.query(`DROP INDEX "public"."idx_notification_templates_channel"`);
        await queryRunner.query(`DROP INDEX "public"."idx_notification_logs_phone"`);
        await queryRunner.query(`DROP INDEX "public"."idx_notification_logs_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_customer_points_earn_idempotent"`);
        await queryRunner.query(`ALTER TABLE "notification_templates" DROP CONSTRAINT "UQ_notification_templates_event_channel_lang"`);
        await queryRunner.query(`CREATE TABLE "brands" ("id" BIGSERIAL NOT NULL, "name" character varying(150) NOT NULL, "slug" character varying(180) NOT NULL, "logo_url" text, "description" text, "website_url" character varying(500), "status" character varying(20) NOT NULL DEFAULT 'active', "is_deleted" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b15428f362be2200922952dc268" UNIQUE ("slug"), CONSTRAINT "PK_b0c437120b624da1034a81fc561" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "products" ADD "brand_id" bigint`);
        await queryRunner.query(`ALTER TABLE "notification_channels" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "notification_channels" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "notification_channels" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "notification_channels" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "notification_events" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "notification_events" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "notification_events" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "notification_events" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "notification_templates" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "notification_templates" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "notification_templates" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "notification_templates" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "notification_logs" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "notification_logs" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "loyalty_config" ALTER COLUMN "earn_rate" SET DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "loyalty_config" ALTER COLUMN "point_value" SET DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "loyalty_config" ALTER COLUMN "redeem_value" SET DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "loyalty_config" ALTER COLUMN "max_redeem_percent" SET DEFAULT '50'`);
        await queryRunner.query(`ALTER TABLE "notification_templates" ADD CONSTRAINT "UQ_d96337e7e169613aac40bb3ecd9" UNIQUE ("event_id", "channel_id", "language")`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_1530a6f15d3c79d1b70be98f2be" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_templates" ADD CONSTRAINT "FK_66575b0817815bd3ca1c20364b0" FOREIGN KEY ("event_id") REFERENCES "notification_events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_templates" ADD CONSTRAINT "FK_efed5f502d6e263cffb79e4ad04" FOREIGN KEY ("channel_id") REFERENCES "notification_channels"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loyalty_redemption_requests" ADD CONSTRAINT "FK_5fa6a45f4f23185279fcee0b828" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loyalty_redemption_requests" ADD CONSTRAINT "FK_a5509c97eccb342eb45e9d872f1" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customer_points" ADD CONSTRAINT "FK_0ebb6a8e7d5822e0fde6f2da5b3" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customer_points" ADD CONSTRAINT "FK_d957f8d54900f328d879727cd6e" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customer_point_balances" ADD CONSTRAINT "FK_ccc753124ee08ac520ae412ce4d" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customer_point_balances" DROP CONSTRAINT "FK_ccc753124ee08ac520ae412ce4d"`);
        await queryRunner.query(`ALTER TABLE "customer_points" DROP CONSTRAINT "FK_d957f8d54900f328d879727cd6e"`);
        await queryRunner.query(`ALTER TABLE "customer_points" DROP CONSTRAINT "FK_0ebb6a8e7d5822e0fde6f2da5b3"`);
        await queryRunner.query(`ALTER TABLE "loyalty_redemption_requests" DROP CONSTRAINT "FK_a5509c97eccb342eb45e9d872f1"`);
        await queryRunner.query(`ALTER TABLE "loyalty_redemption_requests" DROP CONSTRAINT "FK_5fa6a45f4f23185279fcee0b828"`);
        await queryRunner.query(`ALTER TABLE "notification_templates" DROP CONSTRAINT "FK_efed5f502d6e263cffb79e4ad04"`);
        await queryRunner.query(`ALTER TABLE "notification_templates" DROP CONSTRAINT "FK_66575b0817815bd3ca1c20364b0"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_1530a6f15d3c79d1b70be98f2be"`);
        await queryRunner.query(`ALTER TABLE "notification_templates" DROP CONSTRAINT "UQ_d96337e7e169613aac40bb3ecd9"`);
        await queryRunner.query(`ALTER TABLE "loyalty_config" ALTER COLUMN "max_redeem_percent" SET DEFAULT 50.00`);
        await queryRunner.query(`ALTER TABLE "loyalty_config" ALTER COLUMN "redeem_value" SET DEFAULT 1.0`);
        await queryRunner.query(`ALTER TABLE "loyalty_config" ALTER COLUMN "point_value" SET DEFAULT 1.0`);
        await queryRunner.query(`ALTER TABLE "loyalty_config" ALTER COLUMN "earn_rate" SET DEFAULT 1.0`);
        await queryRunner.query(`ALTER TABLE "notification_logs" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "notification_logs" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "notification_templates" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "notification_templates" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "notification_templates" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "notification_templates" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "notification_events" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "notification_events" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "notification_events" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "notification_events" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "notification_channels" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "notification_channels" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "notification_channels" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "notification_channels" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "brand_id"`);
        await queryRunner.query(`DROP TABLE "brands"`);
        await queryRunner.query(`ALTER TABLE "notification_templates" ADD CONSTRAINT "UQ_notification_templates_event_channel_lang" UNIQUE ("event_id", "channel_id", "language")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_customer_points_earn_idempotent" ON "customer_points" ("order_id", "type") WHERE (((type)::text = ANY ((ARRAY['earned'::character varying, 'pending'::character varying])::text[])) AND (order_id IS NOT NULL))`);
        await queryRunner.query(`CREATE INDEX "idx_notification_logs_created_at" ON "notification_logs" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_notification_logs_phone" ON "notification_logs" ("phone") `);
        await queryRunner.query(`CREATE INDEX "idx_notification_templates_channel" ON "notification_templates" ("channel_id") `);
        await queryRunner.query(`CREATE INDEX "idx_notification_templates_event" ON "notification_templates" ("event_id") `);
        await queryRunner.query(`ALTER TABLE "customer_point_balances" ADD CONSTRAINT "FK_customer_point_balances_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customer_points" ADD CONSTRAINT "FK_customer_points_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customer_points" ADD CONSTRAINT "FK_customer_points_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loyalty_redemption_requests" ADD CONSTRAINT "FK_loyalty_redemption_requests_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loyalty_redemption_requests" ADD CONSTRAINT "FK_loyalty_redemption_requests_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_templates" ADD CONSTRAINT "FK_notification_templates_event" FOREIGN KEY ("event_id") REFERENCES "notification_events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_templates" ADD CONSTRAINT "FK_notification_templates_channel" FOREIGN KEY ("channel_id") REFERENCES "notification_channels"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}

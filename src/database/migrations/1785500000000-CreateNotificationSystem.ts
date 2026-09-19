import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationSystem1785500000000 implements MigrationInterface {
  name = 'CreateNotificationSystem1785500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. notification_channels
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_channels" (
        "id" SERIAL PRIMARY KEY,
        "code" varchar(20) NOT NULL UNIQUE,
        "name" varchar(50) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );
    `);

    // 2. notification_events
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_events" (
        "id" SERIAL PRIMARY KEY,
        "event_code" varchar(100) NOT NULL UNIQUE,
        "description" text,
        "category" varchar(30) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );
    `);

    // 3. notification_templates
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_templates" (
        "id" SERIAL PRIMARY KEY,
        "event_id" integer NOT NULL,
        "channel_id" integer NOT NULL,
        "language" varchar(10) NOT NULL DEFAULT 'en',
        "title" varchar(100),
        "body_template" text NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "FK_notification_templates_event" FOREIGN KEY ("event_id") REFERENCES "notification_events"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_notification_templates_channel" FOREIGN KEY ("channel_id") REFERENCES "notification_channels"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_notification_templates_event_channel_lang" UNIQUE ("event_id", "channel_id", "language")
      );
    `);

    // 4. notification_logs
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_logs" (
        "id" BIGSERIAL PRIMARY KEY,
        "event_code" varchar(100) NOT NULL,
        "phone" varchar(20) NOT NULL,
        "message" text NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'sent',
        "error" text,
        "order_id" bigint,
        "customer_id" bigint,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );
    `);

    // Indexes
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_notification_logs_phone" ON "notification_logs" ("phone");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_notification_logs_created_at" ON "notification_logs" ("created_at");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_notification_templates_event" ON "notification_templates" ("event_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_notification_templates_channel" ON "notification_templates" ("channel_id");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_logs";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_templates";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_events";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_channels";`);
  }
}

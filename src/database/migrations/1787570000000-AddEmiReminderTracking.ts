import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmiReminderTracking1787570000000 implements MigrationInterface {
  name = 'AddEmiReminderTracking1787570000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "emi_schedules" ADD COLUMN IF NOT EXISTS "reminder_sent_at" timestamptz NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "emi_schedules" ADD COLUMN IF NOT EXISTS "reminder_sent_count" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "emi_schedules" DROP COLUMN IF EXISTS "reminder_sent_count"`,
    );
    await queryRunner.query(
      `ALTER TABLE "emi_schedules" DROP COLUMN IF EXISTS "reminder_sent_at"`,
    );
  }
}

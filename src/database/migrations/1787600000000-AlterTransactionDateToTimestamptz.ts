import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTransactionDateToTimestamptz1787600000000 implements MigrationInterface {
  name = 'AlterTransactionDateToTimestamptz1787600000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "transactions"
      ALTER COLUMN "transaction_date" TYPE timestamptz USING (
        CASE
          WHEN created_at IS NOT NULL THEN created_at
          ELSE transaction_date::timestamptz
        END
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "transactions"
      ALTER COLUMN "transaction_date" TYPE date USING (transaction_date::date)
    `);
  }
}

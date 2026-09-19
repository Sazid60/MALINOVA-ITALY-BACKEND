import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLowStockThresholdAndLifecycleMonths1787544000000 implements MigrationInterface {
    name = 'AddLowStockThresholdAndLifecycleMonths1787544000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "low_stock_threshold" integer NOT NULL DEFAULT 10`);
        await queryRunner.query(`ALTER TABLE "products" ADD "lifecycle_months" integer NOT NULL DEFAULT 6`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "lifecycle_months"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "low_stock_threshold"`);
    }
}

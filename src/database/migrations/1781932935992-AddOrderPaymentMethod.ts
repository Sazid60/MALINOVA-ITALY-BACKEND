import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderPaymentMethod1781932935992 implements MigrationInterface {
    name = 'AddOrderPaymentMethod1781932935992'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" ADD "payment_method" character varying(30)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "payment_method"`);
    }

}

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOriginalPriceToOrderItems1782546291488 implements MigrationInterface {
    name = 'AddOriginalPriceToOrderItems1782546291488'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.query(
            `SELECT column_name FROM information_schema.columns WHERE table_name='order_items' AND column_name='original_price'`
        );
        if (!hasColumn || hasColumn.length === 0) {
            await queryRunner.query(`ALTER TABLE "order_items" ADD "original_price" numeric(10,2)`);
        } else {
            console.log(`[MIGRATION] Column original_price already exists on order_items. Skipping ALTER TABLE.`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "original_price"`);
    }

}

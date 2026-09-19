import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTotalQuantityUsedToMaterialUsage1784438175167 implements MigrationInterface {
    name = 'AddTotalQuantityUsedToMaterialUsage1784438175167'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_material_usage" ADD "total_quantity_used" numeric(10,4) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_material_usage" DROP COLUMN "total_quantity_used"`);
    }

}

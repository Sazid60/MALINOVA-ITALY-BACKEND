import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDriftAlignment1786776576762 implements MigrationInterface {
    name = 'AddDriftAlignment1786776576762'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_material_usage" ADD "batch_id" bigint`);
        await queryRunner.query(`ALTER TABLE "loyalty_config" ADD "earn_amount_unit" numeric(10,2) NOT NULL DEFAULT '100'`);
        await queryRunner.query(`ALTER TABLE "loyalty_config" ADD "redeem_on" character varying(20) NOT NULL DEFAULT 'subtotal'`);
        await queryRunner.query(`ALTER TABLE "product_material_usage" ADD CONSTRAINT "FK_04471c8a45d30ce57d5a7090488" FOREIGN KEY ("batch_id") REFERENCES "product_batches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_material_usage" DROP CONSTRAINT "FK_04471c8a45d30ce57d5a7090488"`);
        await queryRunner.query(`ALTER TABLE "loyalty_config" DROP COLUMN "redeem_on"`);
        await queryRunner.query(`ALTER TABLE "loyalty_config" DROP COLUMN "earn_amount_unit"`);
        await queryRunner.query(`ALTER TABLE "product_material_usage" DROP COLUMN "batch_id"`);
    }
}

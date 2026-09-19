import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCartItems1782602730276 implements MigrationInterface {
    name = 'AddCartItems1782602730276'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasTable = await queryRunner.query(
            `SELECT table_name FROM information_schema.tables WHERE table_name='cart_items'`
        );
        if (!hasTable || hasTable.length === 0) {
            await queryRunner.query(`CREATE TABLE "cart_items" ("id" BIGSERIAL NOT NULL, "customer_id" bigint NOT NULL, "variant_id" bigint NOT NULL, "quantity" integer NOT NULL DEFAULT '1', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_0a663f25b2bdca270ad6a8c35dd" UNIQUE ("customer_id", "variant_id"), CONSTRAINT "PK_6fccf5ec03c172d27a28a82928b" PRIMARY KEY ("id"))`);
            try {
                await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_80008bdd41636db833ed7da5bf6" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
            } catch (e) {}
            try {
                await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_ede780fc2b865d1d1323e598038" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
            } catch (e) {}
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_ede780fc2b865d1d1323e598038"`);
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_80008bdd41636db833ed7da5bf6"`);
        await queryRunner.query(`DROP TABLE "cart_items"`);
    }

}

import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductSerialNumbers1787125656332 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "product_serial_numbers" (
                "id" BIGSERIAL PRIMARY KEY,
                "product_id" BIGINT NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
                "batch_id" BIGINT NOT NULL REFERENCES "product_batches"("id") ON DELETE CASCADE,
                "serial_number" VARCHAR(100) UNIQUE NOT NULL,
                "status" VARCHAR(30) NOT NULL DEFAULT 'available',
                "order_item_id" BIGINT REFERENCES "order_items"("id") ON DELETE SET NULL,
                "warranty_start" TIMESTAMP,
                "warranty_end" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);
        await queryRunner.query(`CREATE INDEX "idx_serial_number" ON "product_serial_numbers"("serial_number")`);
        await queryRunner.query(`CREATE INDEX "idx_serial_product" ON "product_serial_numbers"("product_id")`);
        await queryRunner.query(`CREATE INDEX "idx_serial_batch" ON "product_serial_numbers"("batch_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "product_serial_numbers"`);
    }

}

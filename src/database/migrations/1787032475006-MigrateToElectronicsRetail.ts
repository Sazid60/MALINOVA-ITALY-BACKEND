import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrateToElectronicsRetail1787032475006 implements MigrationInterface {
    name = 'MigrateToElectronicsRetail1787032475006'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_images" DROP CONSTRAINT "FK_7645bd68229997627f7b2191687"`);
        await queryRunner.query(`ALTER TABLE "stock_logs" DROP CONSTRAINT "FK_1a6e0ffeca41d4870227efce53a"`);
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_ede780fc2b865d1d1323e598038"`);
        await queryRunner.query(`ALTER TABLE "store_inventory" DROP CONSTRAINT "FK_7e33028a75b8fdfc433ac5b794f"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_db2d0ea722e16e0fe8ab3bce111"`);
        await queryRunner.query(`ALTER TABLE "product_batches" DROP CONSTRAINT "FK_9e874589807ffcc252fb3b06fc7"`);
        await queryRunner.query(`ALTER TABLE "product_material_usage" DROP CONSTRAINT "FK_0f8bb216ec16da829a84e37ec8b"`);
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "UQ_0a663f25b2bdca270ad6a8c35dd"`);
        await queryRunner.query(`ALTER TABLE "store_inventory" DROP CONSTRAINT "UQ_60ade8c3b6fd5afd16ed220ebe7"`);
        await queryRunner.query(`ALTER TABLE "stock_logs" RENAME COLUMN "variant_id" TO "product_id"`);
        await queryRunner.query(`ALTER TABLE "cart_items" RENAME COLUMN "variant_id" TO "product_id"`);
        await queryRunner.query(`ALTER TABLE "store_inventory" RENAME COLUMN "variant_id" TO "product_id"`);
        await queryRunner.query(`ALTER TABLE "order_items" RENAME COLUMN "variant_id" TO "product_id"`);

        // ── Map Variant IDs to Product IDs in data tables ──
        await queryRunner.query(`UPDATE "stock_logs" t SET "product_id" = pv.product_id FROM product_variants pv WHERE t.product_id = pv.id`);
        await queryRunner.query(`UPDATE "cart_items" t SET "product_id" = pv.product_id FROM product_variants pv WHERE t.product_id = pv.id`);
        await queryRunner.query(`UPDATE "store_inventory" t SET "product_id" = pv.product_id FROM product_variants pv WHERE t.product_id = pv.id`);
        await queryRunner.query(`UPDATE "order_items" t SET "product_id" = pv.product_id FROM product_variants pv WHERE t.product_id = pv.id`);

        // ── Deduplicate Store Inventory ──
        await queryRunner.query(`CREATE TEMP TABLE temp_store_inv AS SELECT store_id, product_id, SUM(quantity) as quantity FROM store_inventory GROUP BY store_id, product_id`);
        await queryRunner.query(`DELETE FROM store_inventory`);
        await queryRunner.query(`INSERT INTO store_inventory(store_id, product_id, quantity) SELECT store_id, product_id, quantity FROM temp_store_inv`);
        await queryRunner.query(`DROP TABLE temp_store_inv`);

        // ── Deduplicate Cart Items ──
        await queryRunner.query(`CREATE TEMP TABLE temp_cart_items AS SELECT customer_id, product_id, SUM(quantity) as quantity, MIN(created_at) as created_at, MAX(updated_at) as updated_at FROM cart_items GROUP BY customer_id, product_id`);
        await queryRunner.query(`DELETE FROM cart_items`);
        await queryRunner.query(`INSERT INTO cart_items(customer_id, product_id, quantity, created_at, updated_at) SELECT customer_id, product_id, quantity, created_at, updated_at FROM temp_cart_items`);
        await queryRunner.query(`DROP TABLE temp_cart_items`);

        await queryRunner.query(`CREATE TABLE "product_attribute_definitions" ("id" BIGSERIAL NOT NULL, "category_id" bigint NOT NULL, "key" character varying(100) NOT NULL, "label" character varying(200) NOT NULL, "group_name" character varying(100), "type" character varying(30) NOT NULL DEFAULT 'text', "unit" character varying(30), "options" jsonb, "is_filterable" boolean NOT NULL DEFAULT false, "is_visible" boolean NOT NULL DEFAULT true, "sort_order" integer NOT NULL DEFAULT '0', "status" character varying(20) NOT NULL DEFAULT 'active', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_78c40fd4ed4f7e5596814eb4b92" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "product_images" DROP COLUMN "variant_id"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "default_shelf_life_days"`);
        await queryRunner.query(`ALTER TABLE "product_material_usage" DROP COLUMN "variant_id"`);
        await queryRunner.query(`ALTER TABLE "products" ADD "weight_grams" numeric(10,2) DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "products" ADD "base_price" numeric(12,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "products" ADD "discount_type" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "products" ADD "discount_value" numeric(12,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "products" ADD "final_price" numeric(12,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "products" ADD "warranty_months" integer`);
        await queryRunner.query(`ALTER TABLE "products" ADD "warranty_note" text`);
        await queryRunner.query(`ALTER TABLE "products" ADD "warranty_optional" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "products" ADD "country_of_origin" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "products" ADD "serial_number" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "products" ADD "emi_available" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "products" ADD "product_video_url" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "products" ADD "specifications_json" jsonb DEFAULT '{}'`);

        // ── Safe Product Batch Data Migration ──
        await queryRunner.query(`ALTER TABLE "product_batches" ADD "product_id" bigint NULL`);
        await queryRunner.query(`ALTER TABLE "product_batches" ADD "received_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "product_batches" ADD "cost_price" numeric(12,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "product_batches" ADD "selling_price" numeric(12,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "product_batches" ADD "quantity_received" integer NULL`);

        // Copy IDs from old variant mapping
        await queryRunner.query(`UPDATE "product_batches" pb SET "product_id" = pv.product_id FROM product_variants pv WHERE pb.variant_id = pv.id`);
        // Fill null product_ids with fallback if any
        await queryRunner.query(`UPDATE "product_batches" SET "product_id" = (SELECT id FROM products LIMIT 1) WHERE "product_id" IS NULL`);

        // Copy quantities and costs
        await queryRunner.query(`UPDATE "product_batches" SET "quantity_received" = "quantity_produced", "cost_price" = COALESCE("cost_per_unit", 0)`);
        await queryRunner.query(`UPDATE "product_batches" pb SET "selling_price" = COALESCE(pv.final_price, pv.price, 0) FROM product_variants pv WHERE pb.variant_id = pv.id`);

        // Apply NOT NULL constraints
        await queryRunner.query(`ALTER TABLE "product_batches" ALTER COLUMN "product_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "product_batches" ALTER COLUMN "quantity_received" SET NOT NULL`);

        // Drop deprecated columns
        await queryRunner.query(`ALTER TABLE "product_batches" DROP COLUMN "variant_id"`);
        await queryRunner.query(`ALTER TABLE "product_batches" DROP COLUMN "production_date"`);
        await queryRunner.query(`ALTER TABLE "product_batches" DROP COLUMN "expiry_date"`);
        await queryRunner.query(`ALTER TABLE "product_batches" DROP COLUMN "cost_per_unit"`);
        await queryRunner.query(`ALTER TABLE "product_batches" DROP COLUMN "quantity_produced"`);
        await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "UQ_6f3a95845ed6b82e25366d88a21" UNIQUE ("customer_id", "product_id")`);
        await queryRunner.query(`ALTER TABLE "store_inventory" ADD CONSTRAINT "UQ_8bf0bd5d5ae6c63366537d39114" UNIQUE ("store_id", "product_id")`);
        await queryRunner.query(`ALTER TABLE "product_attribute_definitions" ADD CONSTRAINT "FK_c7c33a0c32add9ece5c51ae6969" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_logs" ADD CONSTRAINT "FK_d959ac0e0f8d5aafac4f75f43db" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_30e89257a105eab7648a35c7fce" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "store_inventory" ADD CONSTRAINT "FK_009c1cd2b1e5a29eb79995c21b1" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_9263386c35b6b242540f9493b00" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_batches" ADD CONSTRAINT "FK_82998c582d28f74cca4eff80a73" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_batches" DROP CONSTRAINT "FK_82998c582d28f74cca4eff80a73"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_9263386c35b6b242540f9493b00"`);
        await queryRunner.query(`ALTER TABLE "store_inventory" DROP CONSTRAINT "FK_009c1cd2b1e5a29eb79995c21b1"`);
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_30e89257a105eab7648a35c7fce"`);
        await queryRunner.query(`ALTER TABLE "stock_logs" DROP CONSTRAINT "FK_d959ac0e0f8d5aafac4f75f43db"`);
        await queryRunner.query(`ALTER TABLE "product_attribute_definitions" DROP CONSTRAINT "FK_c7c33a0c32add9ece5c51ae6969"`);
        await queryRunner.query(`ALTER TABLE "store_inventory" DROP CONSTRAINT "UQ_8bf0bd5d5ae6c63366537d39114"`);
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "UQ_6f3a95845ed6b82e25366d88a21"`);
        await queryRunner.query(`ALTER TABLE "product_batches" DROP COLUMN "quantity_received"`);
        await queryRunner.query(`ALTER TABLE "product_batches" DROP COLUMN "selling_price"`);
        await queryRunner.query(`ALTER TABLE "product_batches" DROP COLUMN "cost_price"`);
        await queryRunner.query(`ALTER TABLE "product_batches" DROP COLUMN "received_at"`);
        await queryRunner.query(`ALTER TABLE "product_batches" DROP COLUMN "product_id"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "specifications_json"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "product_video_url"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "emi_available"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "serial_number"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "country_of_origin"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "warranty_optional"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "warranty_note"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "warranty_months"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "final_price"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "discount_value"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "discount_type"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "base_price"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "weight_grams"`);
        await queryRunner.query(`ALTER TABLE "product_material_usage" ADD "variant_id" bigint`);
        await queryRunner.query(`ALTER TABLE "product_batches" ADD "quantity_produced" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "product_batches" ADD "cost_per_unit" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "product_batches" ADD "expiry_date" date NOT NULL`);
        await queryRunner.query(`ALTER TABLE "product_batches" ADD "production_date" date NOT NULL`);
        await queryRunner.query(`ALTER TABLE "product_batches" ADD "variant_id" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "products" ADD "default_shelf_life_days" integer`);
        await queryRunner.query(`ALTER TABLE "product_images" ADD "variant_id" bigint`);
        await queryRunner.query(`DROP TABLE "product_attribute_definitions"`);
        await queryRunner.query(`ALTER TABLE "order_items" RENAME COLUMN "product_id" TO "variant_id"`);
        await queryRunner.query(`ALTER TABLE "store_inventory" RENAME COLUMN "product_id" TO "variant_id"`);
        await queryRunner.query(`ALTER TABLE "cart_items" RENAME COLUMN "product_id" TO "variant_id"`);
        await queryRunner.query(`ALTER TABLE "stock_logs" RENAME COLUMN "product_id" TO "variant_id"`);
        await queryRunner.query(`ALTER TABLE "store_inventory" ADD CONSTRAINT "UQ_60ade8c3b6fd5afd16ed220ebe7" UNIQUE ("variant_id", "store_id")`);
        await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "UQ_0a663f25b2bdca270ad6a8c35dd" UNIQUE ("customer_id", "variant_id")`);
        await queryRunner.query(`ALTER TABLE "product_material_usage" ADD CONSTRAINT "FK_0f8bb216ec16da829a84e37ec8b" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_batches" ADD CONSTRAINT "FK_9e874589807ffcc252fb3b06fc7" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_db2d0ea722e16e0fe8ab3bce111" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "store_inventory" ADD CONSTRAINT "FK_7e33028a75b8fdfc433ac5b794f" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_ede780fc2b865d1d1323e598038" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_logs" ADD CONSTRAINT "FK_1a6e0ffeca41d4870227efce53a" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_images" ADD CONSTRAINT "FK_7645bd68229997627f7b2191687" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}

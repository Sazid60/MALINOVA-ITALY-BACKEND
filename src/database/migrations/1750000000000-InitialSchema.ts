import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * InitialSchema — single source-of-truth migration.
 * Replaces all previous incremental migrations.
 * Creates every table in dependency order (parents before children).
 * Safe to run on a blank database.
 */
export class InitialSchema1750000000000 implements MigrationInterface {
  name = 'InitialSchema1750000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {

    // ── 1. Roles ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id"          BIGSERIAL PRIMARY KEY,
        "name"        VARCHAR(50)  NOT NULL UNIQUE,
        "description" TEXT,
        "status"      VARCHAR(20)  NOT NULL DEFAULT 'active',
        "is_system"   BOOLEAN      NOT NULL DEFAULT false,
        "created_at"  TIMESTAMP    NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP    NOT NULL DEFAULT now()
      )
    `);

    // ── 2. Permissions ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id"          BIGSERIAL PRIMARY KEY,
        "code"        VARCHAR(100) NOT NULL UNIQUE,
        "description" TEXT,
        "module"      VARCHAR(50)  NOT NULL,
        "created_at"  TIMESTAMP    NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP    NOT NULL DEFAULT now()
      )
    `);

    // ── 3. Role-Permission mapping ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "id"            BIGSERIAL PRIMARY KEY,
        "role_id"       BIGINT NOT NULL,
        "permission_id" BIGINT NOT NULL,
        CONSTRAINT "FK_role_permissions_role"
          FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_role_permissions_permission"
          FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
      )
    `);

    // ── 4. Users ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"            BIGSERIAL PRIMARY KEY,
        "username"      VARCHAR(150) NOT NULL,
        "name"          VARCHAR(150) NOT NULL,
        "email"         VARCHAR(150) NOT NULL UNIQUE,
        "mobile_number" VARCHAR(20),
        "password"      TEXT         NOT NULL,
        "role_id"       BIGINT,
        "status"        VARCHAR(20)  NOT NULL DEFAULT 'active',
        "last_login_at" TIMESTAMP,
        "created_at"    TIMESTAMP    NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "FK_users_role"
          FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL
      )
    `);

    // ── 5. User-Permission overrides ──────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "user_permissions" (
        "id"                  BIGSERIAL PRIMARY KEY,
        "user_id"             BIGINT  NOT NULL,
        "permission_id"       BIGINT  NOT NULL,
        "allowed"             BOOLEAN NOT NULL DEFAULT true,
        "inherited_from_role" BOOLEAN NOT NULL DEFAULT false,
        "created_at"          TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"          TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_user_permissions_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_permissions_permission"
          FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
      )
    `);

    // ── 6. Customers ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "customers" (
        "id"            BIGSERIAL PRIMARY KEY,
        "mobile_number" VARCHAR(20)  NOT NULL UNIQUE,
        "name"          VARCHAR(150),
        "email"         VARCHAR(150),
        "status"        VARCHAR(20)  NOT NULL DEFAULT 'active',
        "created_at"    TIMESTAMP    NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMP    NOT NULL DEFAULT now()
      )
    `);

    // ── 7. Customer Addresses ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "customer_addresses" (
        "id"          BIGSERIAL PRIMARY KEY,
        "customer_id" BIGINT  NOT NULL,
        "address"     TEXT    NOT NULL,
        "area"        VARCHAR(100),
        "city"        VARCHAR(100),
        "is_default"  BOOLEAN NOT NULL DEFAULT false,
        "created_at"  TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_customer_addresses_customer"
          FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE
      )
    `);

    // ── 8. Customer Tags ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "customer_tags" (
        "id"   BIGSERIAL PRIMARY KEY,
        "name" VARCHAR(50) NOT NULL UNIQUE
      )
    `);

    // ── 9. Customer Tag Map ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "customer_tag_map" (
        "id"          BIGSERIAL PRIMARY KEY,
        "customer_id" BIGINT NOT NULL,
        "tag_id"      BIGINT NOT NULL,
        CONSTRAINT "FK_customer_tag_map_customer"
          FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_customer_tag_map_tag"
          FOREIGN KEY ("tag_id") REFERENCES "customer_tags"("id") ON DELETE CASCADE
      )
    `);

    // ── 10. Suppliers ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "suppliers" (
        "id"             BIGSERIAL PRIMARY KEY,
        "seller_name"    VARCHAR(150) NOT NULL,
        "contact_person" VARCHAR(100),
        "phone"          VARCHAR(20),
        "email"          VARCHAR(150),
        "address"        TEXT,
        "status"         VARCHAR(20) NOT NULL DEFAULT 'active',
        "created_at"     TIMESTAMP   NOT NULL DEFAULT now(),
        "updated_at"     TIMESTAMP   NOT NULL DEFAULT now()
      )
    `);

    // ── 11. Product Categories ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "product_categories" (
        "id"          BIGSERIAL PRIMARY KEY,
        "name"        VARCHAR(100) NOT NULL,
        "description" TEXT,
        "slug"        VARCHAR(120) NOT NULL UNIQUE,
        "status"      VARCHAR(20)  NOT NULL DEFAULT 'active',
        "created_at"  TIMESTAMP    NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP    NOT NULL DEFAULT now()
      )
    `);

    // ── 12. Products ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id"                    BIGSERIAL PRIMARY KEY,
        "category_id"           BIGINT,
        "name"                  VARCHAR(200) NOT NULL,
        "slug"                  VARCHAR(220) NOT NULL UNIQUE,
        "description"           TEXT,
        "default_shelf_life_days" INTEGER,
        "status"                VARCHAR(20)  NOT NULL DEFAULT 'active',
        "created_at"            TIMESTAMP    NOT NULL DEFAULT now(),
        "updated_at"            TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "FK_products_category"
          FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE SET NULL
      )
    `);

    // ── 13. Product Variants ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "product_variants" (
        "id"                  BIGSERIAL PRIMARY KEY,
        "product_id"          BIGINT       NOT NULL,
        "sku"                 VARCHAR(50)  NOT NULL UNIQUE,
        "name"                VARCHAR(150) NOT NULL,
        "slug"                VARCHAR(220) NOT NULL UNIQUE,
        "description"         TEXT,
        "price"               NUMERIC(10,2) NOT NULL,
        "discount_type"       VARCHAR(20),
        "discount_value"      NUMERIC(10,2) NOT NULL DEFAULT 0,
        "final_price"         NUMERIC(10,2),
        "low_stock_threshold" INTEGER       NOT NULL DEFAULT 5,
        "weight_grams"        INTEGER,
        "jar_weight"          INTEGER,
        "actual_weight_gm"    INTEGER,
        "total_weight_gm"     INTEGER,
        "status"              VARCHAR(20)   NOT NULL DEFAULT 'active',
        "is_primary"          BOOLEAN       NOT NULL DEFAULT false,
        "attributes_json"     JSONB,
        "created_at"          TIMESTAMP     NOT NULL DEFAULT now(),
        "updated_at"          TIMESTAMP     NOT NULL DEFAULT now(),
        CONSTRAINT "FK_product_variants_product"
          FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
      )
    `);

    // ── 14. Product Images ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "product_images" (
        "id"                   BIGSERIAL PRIMARY KEY,
        "product_id"           BIGINT  NOT NULL,
        "cloudinary_public_id" TEXT,
        "image_url"            TEXT    NOT NULL,
        "is_primary"           BOOLEAN NOT NULL DEFAULT false,
        CONSTRAINT "FK_product_images_product"
          FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
      )
    `);

    // ── 15. SEO Meta ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "seo_meta" (
        "id"               BIGSERIAL PRIMARY KEY,
        "entity_type"      VARCHAR(50)  NOT NULL,
        "entity_id"        BIGINT       NOT NULL,
        "meta_title"       VARCHAR(200),
        "meta_description" TEXT,
        "og_image_url"     TEXT,
        "indexable"        BOOLEAN NOT NULL DEFAULT true
      )
    `);

    // ── 16. Materials ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "materials" (
        "id"   BIGSERIAL PRIMARY KEY,
        "name" VARCHAR(150) NOT NULL,
        "type" VARCHAR(30)  NOT NULL,
        "unit" VARCHAR(20)  NOT NULL
      )
    `);

    // ── 17. Material Purchases ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "material_purchases" (
        "id"                 BIGSERIAL PRIMARY KEY,
        "material_id"        BIGINT         NOT NULL,
        "supplier_id"        BIGINT,
        "purchase_reference" VARCHAR(100),
        "quantity"           NUMERIC(10,3)  NOT NULL,
        "unit_price"         NUMERIC(10,2)  NOT NULL,
        "additional_charges" NUMERIC(10,2)  NOT NULL DEFAULT 0,
        "total_price"        NUMERIC(10,2),
        "effective_unit_cost" NUMERIC(10,4),
        "purchase_date"      DATE           NOT NULL,
        "note"               TEXT,
        "created_at"         TIMESTAMP      NOT NULL DEFAULT now(),
        CONSTRAINT "FK_material_purchases_material"
          FOREIGN KEY ("material_id") REFERENCES "materials"("id"),
        CONSTRAINT "FK_material_purchases_supplier"
          FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL
      )
    `);

    // ── 18. Product Material Usage ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "product_material_usage" (
        "id"            BIGSERIAL PRIMARY KEY,
        "product_id"    BIGINT        NOT NULL,
        "variant_id"    BIGINT,
        "material_id"   BIGINT        NOT NULL,
        "damaged_stock" NUMERIC(12,3) NOT NULL DEFAULT 0,
        "quantity_used" NUMERIC(10,4) NOT NULL,
        CONSTRAINT "FK_product_material_usage_material"
          FOREIGN KEY ("material_id") REFERENCES "materials"("id"),
        CONSTRAINT "FK_product_material_usage_variant"
          FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE
      )
    `);

    // ── 19. Stores ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "stores" (
        "id"              BIGSERIAL PRIMARY KEY,
        "name"            VARCHAR(100) NOT NULL,
        "type"            VARCHAR(30)  NOT NULL,
        "address"         TEXT,
        "area"            VARCHAR(100),
        "city"            VARCHAR(100),
        "contact_number"  VARCHAR(20),
        "is_active"       BOOLEAN   NOT NULL DEFAULT true,
        "pathao_store_id" INTEGER,
        "created_at"      TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"      TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ── 20. Product Batches ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "product_batches" (
        "id"                 BIGSERIAL PRIMARY KEY,
        "variant_id"         BIGINT        NOT NULL,
        "store_id"           BIGINT,
        "batch_code"         VARCHAR(100)  NOT NULL UNIQUE,
        "production_date"    DATE          NOT NULL,
        "expiry_date"        DATE          NOT NULL,
        "cost_per_unit"      NUMERIC(10,2),
        "quantity_produced"  INTEGER       NOT NULL,
        "quantity_remaining" INTEGER       NOT NULL,
        "status"             VARCHAR(20)   NOT NULL DEFAULT 'active',
        "created_at"         TIMESTAMP     NOT NULL DEFAULT now(),
        CONSTRAINT "FK_product_batches_variant"
          FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_product_batches_store"
          FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL
      )
    `);

    // ── 21. Store Inventory ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "store_inventory" (
        "id"         BIGSERIAL PRIMARY KEY,
        "variant_id" BIGINT  NOT NULL,
        "store_id"   BIGINT  NOT NULL,
        "quantity"   INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_store_inventory_store_variant" UNIQUE ("store_id", "variant_id"),
        CONSTRAINT "FK_store_inventory_store"
          FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_store_inventory_variant"
          FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE
      )
    `);

    // ── 22. Stock Logs ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "stock_logs" (
        "id"          BIGSERIAL PRIMARY KEY,
        "variant_id"  BIGINT      NOT NULL,
        "store_id"    BIGINT,
        "change_type" VARCHAR(30) NOT NULL,
        "quantity"    INTEGER     NOT NULL,
        "note"        TEXT,
        "created_at"  TIMESTAMP   NOT NULL DEFAULT now(),
        CONSTRAINT "FK_stock_logs_variant"
          FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id"),
        CONSTRAINT "FK_stock_logs_store"
          FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL
      )
    `);

    // ── 23. Product Cost Summary ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "product_cost_summary" (
        "id"                 BIGSERIAL PRIMARY KEY,
        "product_id"         BIGINT        NOT NULL,
        "batch_id"           BIGINT,
        "raw_material_cost"  NUMERIC(10,2) NOT NULL DEFAULT 0,
        "packaging_cost"     NUMERIC(10,2) NOT NULL DEFAULT 0,
        "marketing_cost"     NUMERIC(10,2) NOT NULL DEFAULT 0,
        "other_cost"         NUMERIC(10,2) NOT NULL DEFAULT 0,
        "total_cost"         NUMERIC(10,2) NOT NULL DEFAULT 0,
        "profit_per_unit"    NUMERIC(10,2) NOT NULL DEFAULT 0,
        "last_calculated_at" TIMESTAMP     NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_product_cost_summary_product_batch"
          UNIQUE ("product_id", "batch_id"),
        CONSTRAINT "FK_product_cost_summary_product"
          FOREIGN KEY ("product_id") REFERENCES "products"("id"),
        CONSTRAINT "FK_product_cost_summary_batch"
          FOREIGN KEY ("batch_id") REFERENCES "product_batches"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_03385377472a7e971216db2b86"
        ON "product_cost_summary" ("product_id", "batch_id")
    `);

    // ── 24. Coupons ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "coupons" (
        "id"                  BIGSERIAL PRIMARY KEY,
        "code"                VARCHAR(50)  NOT NULL UNIQUE,
        "discount_type"       VARCHAR(20)  NOT NULL,
        "discount_value"      NUMERIC(10,2) NOT NULL,
        "min_order_amount"    NUMERIC(10,2) NOT NULL DEFAULT 0,
        "max_discount_amount" NUMERIC(10,2),
        "usage_limit"         INTEGER,
        "used_count"          INTEGER NOT NULL DEFAULT 0,
        "valid_from"          DATE,
        "valid_to"            DATE
      )
    `);

    // ── 25. Delivery Partners ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "delivery_partners" (
        "id"             BIGSERIAL PRIMARY KEY,
        "name"           VARCHAR(100) NOT NULL,
        "contact_number" VARCHAR(30),
        "api_enabled"    BOOLEAN  NOT NULL DEFAULT false,
        "status"         VARCHAR(20) NOT NULL DEFAULT 'active',
        "created_at"     TIMESTAMP   NOT NULL DEFAULT now()
      )
    `);

    // ── 26. Delivery Charge Rules ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "delivery_charge_rules" (
        "id"                  BIGSERIAL PRIMARY KEY,
        "rule_name"           VARCHAR(100) NOT NULL,
        "area_type"           VARCHAR(50)  NOT NULL,
        "delivery_partner_id" BIGINT       NOT NULL,
        "min_weight_grams"    INTEGER      NOT NULL,
        "max_weight_grams"    INTEGER,
        "base_charge"         NUMERIC(10,2) NOT NULL DEFAULT 0,
        "additional_per_kg"   NUMERIC(10,2) NOT NULL DEFAULT 0,
        "cod_charge_type"     VARCHAR(20)   NOT NULL DEFAULT 'none',
        "cod_charge_value"    NUMERIC(10,2) NOT NULL DEFAULT 0,
        "is_active"           BOOLEAN       NOT NULL DEFAULT true,
        "created_at"          TIMESTAMP     NOT NULL DEFAULT now(),
        "updated_at"          TIMESTAMP     NOT NULL DEFAULT now(),
        CONSTRAINT "FK_delivery_charge_rules_partner"
          FOREIGN KEY ("delivery_partner_id") REFERENCES "delivery_partners"("id")
      )
    `);

    // ── 27. Orders ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id"              BIGSERIAL PRIMARY KEY,
        "order_number"    VARCHAR(50)   NOT NULL UNIQUE,
        "order_type"      VARCHAR(20)   NOT NULL DEFAULT 'online',
        "customer_id"     BIGINT        NOT NULL,
        "address_id"      BIGINT,
        "store_id"        BIGINT,
        "subtotal"        NUMERIC(10,2) NOT NULL DEFAULT 0,
        "discount_amount" NUMERIC(10,2) NOT NULL DEFAULT 0,
        "delivery_charge" NUMERIC(10,2) NOT NULL DEFAULT 0,
        "total_weight_gm" INTEGER       NOT NULL DEFAULT 0,
        "cod_extra_charge" NUMERIC(10,2) NOT NULL DEFAULT 0,
        "applied_rule_id" BIGINT,
        "total_amount"    NUMERIC(10,2) NOT NULL DEFAULT 0,
        "coupon_id"       BIGINT,
        "status"          VARCHAR(30)   NOT NULL DEFAULT 'pending',
        "vat_rate"        NUMERIC(5,2)  NOT NULL DEFAULT 0,
        "vat_amount"      NUMERIC(12,2) NOT NULL DEFAULT 0,
        "is_vat_inclusive" BOOLEAN      NOT NULL DEFAULT false,
        "return_status"   VARCHAR(20)   NOT NULL DEFAULT 'none',
        "total_refunded"  NUMERIC(12,2) NOT NULL DEFAULT 0,
        "created_at"      TIMESTAMP     NOT NULL DEFAULT now(),
        "updated_at"      TIMESTAMP     NOT NULL DEFAULT now(),
        CONSTRAINT "FK_orders_customer"
          FOREIGN KEY ("customer_id") REFERENCES "customers"("id"),
        CONSTRAINT "FK_orders_address"
          FOREIGN KEY ("address_id") REFERENCES "customer_addresses"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_orders_store"
          FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_orders_coupon"
          FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_orders_applied_rule"
          FOREIGN KEY ("applied_rule_id") REFERENCES "delivery_charge_rules"("id") ON DELETE SET NULL
      )
    `);

    // ── 28. Order Items ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id"                BIGSERIAL PRIMARY KEY,
        "order_id"          BIGINT        NOT NULL,
        "variant_id"        BIGINT        NOT NULL,
        "batch_id"          BIGINT,
        "quantity"          INTEGER       NOT NULL,
        "price"             NUMERIC(10,2) NOT NULL,
        "total"             NUMERIC(10,2) NOT NULL,
        "returned_quantity" INTEGER       NOT NULL DEFAULT 0,
        "return_reason"     TEXT,
        CONSTRAINT "FK_order_items_order"
          FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_order_items_variant"
          FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id"),
        CONSTRAINT "FK_order_items_batch"
          FOREIGN KEY ("batch_id") REFERENCES "product_batches"("id") ON DELETE SET NULL
      )
    `);

    // ── 29. Order Notes ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "order_notes" (
        "id"         BIGSERIAL PRIMARY KEY,
        "order_id"   BIGINT      NOT NULL,
        "note_type"  VARCHAR(30) NOT NULL,
        "note_text"  TEXT        NOT NULL,
        "created_by" BIGINT,
        "created_at" TIMESTAMP   NOT NULL DEFAULT now(),
        CONSTRAINT "FK_order_notes_order"
          FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE
      )
    `);

    // ── 30. Order Returns ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "order_returns" (
        "id"                    BIGSERIAL PRIMARY KEY,
        "order_id"              BIGINT        NOT NULL,
        "order_item_id"         BIGINT,
        "customer_id"           BIGINT        NOT NULL,
        "requested_quantity"    INTEGER       NOT NULL,
        "returned_quantity"     INTEGER,
        "reason"                TEXT,
        "status"                VARCHAR(30)   NOT NULL DEFAULT 'requested',
        "return_type"           VARCHAR(30),
        "approved_by"           BIGINT,
        "approved_at"           TIMESTAMP,
        "refund_amount"         NUMERIC(12,2) NOT NULL DEFAULT 0,
        "refund_method"         VARCHAR(30),
        "refund_status"         VARCHAR(20)   NOT NULL DEFAULT 'pending',
        "refund_transaction_id" VARCHAR(100),
        "notes"                 TEXT,
        "return_received_date"  DATE,
        "condition_on_return"   VARCHAR(30),
        "created_at"            TIMESTAMP     NOT NULL DEFAULT now(),
        "updated_at"            TIMESTAMP     NOT NULL DEFAULT now(),
        CONSTRAINT "FK_order_returns_order"
          FOREIGN KEY ("order_id") REFERENCES "orders"("id"),
        CONSTRAINT "FK_order_returns_order_item"
          FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_order_returns_customer"
          FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
      )
    `);

    // ── 31. Order Delivery ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "order_delivery" (
        "id"                  BIGSERIAL PRIMARY KEY,
        "order_id"            BIGINT      NOT NULL UNIQUE,
        "delivery_partner_id" BIGINT      NOT NULL,
        "tracking_number"     VARCHAR(100),
        "delivery_status"     VARCHAR(30) NOT NULL DEFAULT 'pending',
        "assigned_at"         TIMESTAMP,
        "created_at"          TIMESTAMP   NOT NULL DEFAULT now(),
        CONSTRAINT "FK_order_delivery_order"
          FOREIGN KEY ("order_id") REFERENCES "orders"("id"),
        CONSTRAINT "FK_order_delivery_partner"
          FOREIGN KEY ("delivery_partner_id") REFERENCES "delivery_partners"("id")
      )
    `);

    // ── 32. Transactions ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id"                  BIGSERIAL PRIMARY KEY,
        "transaction_date"    DATE          NOT NULL,
        "transaction_type"    VARCHAR(30)   NOT NULL,
        "reference_id"        BIGINT,
        "reference_type"      VARCHAR(30),
        "description"         TEXT,
        "amount"              NUMERIC(12,2) NOT NULL,
        "payment_method"      VARCHAR(30),
        "party_id"            BIGINT,
        "party_type"          VARCHAR(20),
        "status"              VARCHAR(20)   NOT NULL DEFAULT 'completed',
        "created_by_user_id"  BIGINT,
        "notes"               TEXT,
        "created_at"          TIMESTAMP     NOT NULL DEFAULT now(),
        "updated_at"          TIMESTAMP     NOT NULL DEFAULT now()
      )
    `);

    // ── 33. Expenses ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "expenses" (
        "id"           BIGSERIAL PRIMARY KEY,
        "name"         VARCHAR(100)  NOT NULL,
        "description"  TEXT,
        "amount"       NUMERIC(12,2) NOT NULL,
        "expense_date" DATE          NOT NULL,
        "status"       VARCHAR(20)   NOT NULL DEFAULT 'active',
        "created_at"   TIMESTAMP     NOT NULL DEFAULT now(),
        "updated_at"   TIMESTAMP     NOT NULL DEFAULT now()
      )
    `);

    // ── 34. Charge (delivery charge rules v2 / legacy) ────────────────────────
    await queryRunner.query(`
      CREATE TYPE "charge_cod_charge_type_enum" AS ENUM ('none', 'percent', 'fixed')
    `);
    await queryRunner.query(`
      CREATE TABLE "charge" (
        "id"               BIGSERIAL PRIMARY KEY,
        "rule_name"        VARCHAR(100) NOT NULL,
        "area_type"        VARCHAR(50)  NOT NULL,
        "min_weight_grams" INTEGER      NOT NULL,
        "max_weight_grams" INTEGER,
        "base_charge"      NUMERIC(10,2) NOT NULL DEFAULT 0,
        "additional_per_kg" NUMERIC(10,2) NOT NULL DEFAULT 0,
        "cod_charge_type"  "charge_cod_charge_type_enum" NOT NULL DEFAULT 'none',
        "cod_charge_value" NUMERIC(10,2) NOT NULL DEFAULT 0,
        "is_active"        BOOLEAN       NOT NULL DEFAULT true,
        "created_at"       TIMESTAMP     NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMP     NOT NULL DEFAULT now()
      )
    `);

    // ── 35. Coupons marketing (already done as #24) ───────────────────────────

    // ── 36. CMS: Hero Sections ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "hero_sections" (
        "id"        BIGSERIAL PRIMARY KEY,
        "title"     VARCHAR(200),
        "subtitle"  TEXT,
        "cta_text"  VARCHAR(100),
        "cta_link"  TEXT,
        "is_active" BOOLEAN NOT NULL DEFAULT true
      )
    `);

    // ── 37. CMS: Hero Media ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "hero_media" (
        "id"                   BIGSERIAL PRIMARY KEY,
        "hero_section_id"      BIGINT      NOT NULL,
        "media_type"           VARCHAR(20) NOT NULL,
        "media_url"            TEXT        NOT NULL,
        "cloudinary_public_id" TEXT,
        "sort_order"           INTEGER     NOT NULL DEFAULT 0,
        "is_active"            BOOLEAN     NOT NULL DEFAULT true,
        "created_at"           TIMESTAMP   NOT NULL DEFAULT now(),
        "updated_at"           TIMESTAMP   NOT NULL DEFAULT now(),
        CONSTRAINT "FK_hero_media_section"
          FOREIGN KEY ("hero_section_id") REFERENCES "hero_sections"("id") ON DELETE CASCADE
      )
    `);

    // ── 38. CMS: Blogs ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "blogs" (
        "id"                      BIGSERIAL PRIMARY KEY,
        "title"                   VARCHAR(200) NOT NULL,
        "slug"                    VARCHAR(220) NOT NULL UNIQUE,
        "content"                 TEXT,
        "content_delta"           JSONB,
        "featured_image_url"      VARCHAR(512),
        "featured_image_public_id" TEXT,
        "status"                  VARCHAR(20)  NOT NULL DEFAULT 'draft',
        "published_at"            TIMESTAMP,
        "created_at"              TIMESTAMP    NOT NULL DEFAULT now(),
        "updated_at"              TIMESTAMP    NOT NULL DEFAULT now()
      )
    `);

    // ── 39. CMS: Site Settings ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "site_settings" (
        "id"    BIGSERIAL PRIMARY KEY,
        "key"   VARCHAR(100) NOT NULL UNIQUE,
        "value" TEXT
      )
    `);

    // ── 40. Reviews ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "reviews" (
        "id"            BIGSERIAL PRIMARY KEY,
        "customer_name" VARCHAR(100),
        "type"          VARCHAR(20)  NOT NULL DEFAULT 'text',
        "rating"        SMALLINT     NOT NULL DEFAULT 5,
        "content"       TEXT,
        "image_url"     VARCHAR(512),
        "image_public_id" TEXT,
        "status"        VARCHAR(20)  NOT NULL DEFAULT 'pending',
        "is_featured"   BOOLEAN      NOT NULL DEFAULT false,
        "source"        VARCHAR(20)  NOT NULL DEFAULT 'admin',
        "created_at"    TIMESTAMP    NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMP    NOT NULL DEFAULT now()
      )
    `);

    // ── 41. Pathao Tokens ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "pathao_tokens" (
        "id"            SERIAL PRIMARY KEY,
        "access_token"  TEXT      NOT NULL,
        "refresh_token" TEXT      NOT NULL,
        "expires_at"    TIMESTAMP NOT NULL,
        "updated_at"    TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ── 42. TypeORM Migrations table (managed by TypeORM, listed for reference) ─
    // TypeORM creates this automatically — no need to create it here.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse dependency order
    await queryRunner.query(`DROP TABLE IF EXISTS "pathao_tokens" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reviews" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "site_settings" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blogs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "hero_media" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "hero_sections" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "charge" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "charge_cod_charge_type_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "expenses" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "transactions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order_delivery" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order_returns" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order_notes" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order_items" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orders" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "delivery_charge_rules" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "delivery_partners" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "coupons" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_cost_summary" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "stock_logs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "store_inventory" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_batches" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "stores" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_material_usage" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "material_purchases" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "materials" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "seo_meta" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_images" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_variants" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_categories" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "suppliers" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customer_tag_map" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customer_tags" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customer_addresses" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customers" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_permissions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles" CASCADE`);
  }
}

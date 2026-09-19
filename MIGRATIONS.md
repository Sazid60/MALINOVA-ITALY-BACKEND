# Database Migration Guide

## Setup

This project uses **TypeORM migrations** for all database schema changes.
`synchronize: false` is set in production — migrations are the only way to change the schema.

## Available Commands

```bash
# Run all pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert

# Show migration status (which are pending/run)
npm run migration:show

# Generate a new migration from entity changes
npm run migration:generate src/database/migrations/YourMigrationName

# Create a blank migration file
npm run migration:create src/database/migrations/YourMigrationName
```

## Workflow — Making a Schema Change

### Step 1: Edit the entity file
```typescript
// src/products/product.entity.ts
@Column({ type: 'numeric', precision: 3, scale: 2, default: 0 })
avg_rating: number;
```

### Step 2: Generate migration from entity diff
```bash
npm run migration:generate src/database/migrations/AddProductAvgRating
```
TypeORM compares your entities vs current DB and generates the SQL automatically.

### Step 3: Review generated migration
```typescript
// src/database/migrations/1700000013-AddProductAvgRating.ts
export class AddProductAvgRating1700000013 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" ADD "avg_rating" numeric(3,2) NOT NULL DEFAULT '0'`);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "avg_rating"`);
  }
}
```

### Step 4: Apply migration
```bash
npm run migration:run
```

### Step 5: Commit migration file
```bash
git add src/database/migrations/
git commit -m "migration: add avg_rating to products"
```

## Initial Setup (Fresh Database)

```bash
# 1. Make sure DB exists
createdb achar_db

# 2. Run all migrations (creates all tables)
npm run migration:run

# 3. Seed initial data
npm run seed
```

## Migration Files Overview

| File | What it creates |
|---|---|
| `1700000001-CreateRolesAndPermissions` | roles, permissions, role_permissions |
| `1700000002-CreateUsers`               | users, user_permissions |
| `1700000003-CreateCustomers`           | customers, customer_addresses, customer_tags, customer_tag_map |
| `1700000004-CreateProducts`            | product_categories, products, product_variants, product_images, seo_meta |
| `1700000005-CreateSuppliers`           | suppliers |
| `1700000006-CreateInventory`           | product_batches, stock_logs, materials, material_purchases, product_material_usage, product_cost_summary |
| `1700000007-CreateMarketing`           | coupons |
| `1700000008-CreateDelivery`            | delivery_partners, order_delivery |
| `1700000009-CreateOrders`              | orders, order_items, order_notes, order_returns |
| `1700000010-CreateFinance`             | transactions |
| `1700000011-CreateCms`                 | hero_sections, hero_media, blogs, site_settings |
| `1700000013-AddProductRating`          | **EXAMPLE** — product_reviews table + avg_rating column |
| `1700000014-AddOrderPaymentStatus`     | **EXAMPLE** — payment_status/method/reference columns |
| `1700000015-AddCustomerLoyaltyPoints`  | **EXAMPLE** — loyalty_points + loyalty_transactions table |

## Common Change Examples

### Add a column
```typescript
await queryRunner.query(`
  ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "notes" TEXT
`);
```

### Add a column with default
```typescript
await queryRunner.query(`
  ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "loyalty_points" INTEGER NOT NULL DEFAULT 0
`);
```

### Rename a column
```typescript
await queryRunner.query(`ALTER TABLE "orders" RENAME COLUMN "note" TO "internal_note"`);
```

### Add an index
```typescript
await queryRunner.query(`CREATE INDEX "IDX_orders_status" ON "orders" ("status")`);
```

### Add a new table with FK
```typescript
await queryRunner.query(`
  CREATE TABLE "product_reviews" (
    "id"          BIGSERIAL PRIMARY KEY,
    "product_id"  BIGINT    NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "customer_id" BIGINT    NOT NULL REFERENCES "customers"("id"),
    "rating"      INTEGER   NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
    "body"        TEXT,
    "created_at"  TIMESTAMP NOT NULL DEFAULT NOW()
  )
`);
```

### Change column type
```typescript
// Always handle data conversion!
await queryRunner.query(`
  ALTER TABLE "product_variants"
    ALTER COLUMN "price" TYPE NUMERIC(12,2)
`);
```

### Add NOT NULL column to existing table
```typescript
// Step 1: Add nullable
await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN "priority" VARCHAR(20)`);
// Step 2: Fill existing rows
await queryRunner.query(`UPDATE "orders" SET "priority" = 'normal' WHERE "priority" IS NULL`);
// Step 3: Add constraint
await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "priority" SET NOT NULL`);
await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "priority" SET DEFAULT 'normal'`);
```

## Production Deployment

```bash
# Run migrations before starting the app
npm run migration:run && npm run start:prod

# Or in your Dockerfile / CI pipeline:
CMD ["sh", "-c", "npm run migration:run && node dist/main"]
```

## Environment Variables

Migration commands read from `.env` automatically via `dotenv.config()` in `data-source.ts`.

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=admin
DATABASE_PASSWORD=123
DATABASE_NAME=achar_db

# Or use DATABASE_URL (takes priority)
DATABASE_URL=postgres://admin:123@localhost:5432/achar_db
```

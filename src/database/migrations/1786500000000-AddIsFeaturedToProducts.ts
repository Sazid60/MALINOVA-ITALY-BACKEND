import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsFeaturedToProducts1786500000000 implements MigrationInterface {
    name = 'AddIsFeaturedToProducts1786500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD IF NOT EXISTS "is_featured" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "is_featured"`);
    }
}

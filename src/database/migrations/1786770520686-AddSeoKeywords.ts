import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSeoKeywords1786770520686 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "seo_meta" ADD COLUMN IF NOT EXISTS "keywords" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "seo_meta" DROP COLUMN IF EXISTS "keywords"`);
    }

}

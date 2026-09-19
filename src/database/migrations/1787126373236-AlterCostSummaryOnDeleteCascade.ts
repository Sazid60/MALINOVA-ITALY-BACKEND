import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterCostSummaryOnDeleteCascade1787126373236 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop existing constraint
        await queryRunner.query(`ALTER TABLE "product_cost_summary" DROP CONSTRAINT IF EXISTS "FK_b1a0007bcaea43b76f958cb56f4"`);
        
        // Add new constraint with ON DELETE CASCADE
        await queryRunner.query(`
            ALTER TABLE "product_cost_summary"
            ADD CONSTRAINT "FK_b1a0007bcaea43b76f958cb56f4"
            FOREIGN KEY ("batch_id") REFERENCES "product_batches"("id")
            ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_cost_summary" DROP CONSTRAINT IF EXISTS "FK_b1a0007bcaea43b76f958cb56f4"`);
        await queryRunner.query(`
            ALTER TABLE "product_cost_summary"
            ADD CONSTRAINT "FK_b1a0007bcaea43b76f958cb56f4"
            FOREIGN KEY ("batch_id") REFERENCES "product_batches"("id")
        `);
    }

}

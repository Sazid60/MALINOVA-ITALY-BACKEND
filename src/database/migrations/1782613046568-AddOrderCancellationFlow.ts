import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderCancellationFlow1782613046568 implements MigrationInterface {
    name = 'AddOrderCancellationFlow1782613046568'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasTable = await queryRunner.query(
            `SELECT table_name FROM information_schema.tables WHERE table_name='order_cancel_requests'`
        );
        if (!hasTable || hasTable.length === 0) {
            await queryRunner.query(`CREATE TABLE "order_cancel_requests" ("id" BIGSERIAL NOT NULL, "order_id" bigint NOT NULL, "customer_id" bigint NOT NULL, "reason" text, "status" character varying(30) NOT NULL DEFAULT 'pending', "approved_by" bigint, "approved_at" TIMESTAMP, "reject_reason" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_79eb2570ba956a6883b59ea4eb9" PRIMARY KEY ("id"))`);
        }

        const hasColumn = await queryRunner.query(
            `SELECT column_name FROM information_schema.columns WHERE table_name='orders' AND column_name='cancel_request_status'`
        );
        if (!hasColumn || hasColumn.length === 0) {
            await queryRunner.query(`ALTER TABLE "orders" ADD "cancel_request_status" character varying(30) NOT NULL DEFAULT 'none'`);
        }

        try {
            await queryRunner.query(`ALTER TABLE "order_cancel_requests" ADD CONSTRAINT "FK_8763873126fda4bdd6d3cf9cf9d" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        } catch (e) {}
        try {
            await queryRunner.query(`ALTER TABLE "order_cancel_requests" ADD CONSTRAINT "FK_aa641e46d87337431eb9216b97b" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        } catch (e) {}
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_cancel_requests" DROP CONSTRAINT "FK_aa641e46d87337431eb9216b97b"`);
        await queryRunner.query(`ALTER TABLE "order_cancel_requests" DROP CONSTRAINT "FK_8763873126fda4bdd6d3cf9cf9d"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "cancel_request_status"`);
        await queryRunner.query(`DROP TABLE "order_cancel_requests"`);
    }

}

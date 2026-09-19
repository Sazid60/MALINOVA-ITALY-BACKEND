import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCustomerAuthFields1782282271393 implements MigrationInterface {
    name = 'AddCustomerAuthFields1782282271393'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" ADD "image" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "password" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "password"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "image"`);
    }

}

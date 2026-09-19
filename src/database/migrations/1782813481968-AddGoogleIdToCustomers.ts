import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGoogleIdToCustomers1782813481968 implements MigrationInterface {
    name = 'AddGoogleIdToCustomers1782813481968'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" ADD "google_id" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "UQ_62d8ce6d49dad65788873021c79" UNIQUE ("google_id")`);
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "mobile_number" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "UQ_8536b8b85c06969f84f0c098b03" UNIQUE ("email")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "UQ_8536b8b85c06969f84f0c098b03"`);
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "mobile_number" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "UQ_62d8ce6d49dad65788873021c79"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "google_id"`);
    }

}

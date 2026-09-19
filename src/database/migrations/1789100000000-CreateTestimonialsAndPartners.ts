import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTestimonialsAndPartners1789100000000 implements MigrationInterface {
    name = 'CreateTestimonialsAndPartners1789100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "testimonials" ("id" SERIAL NOT NULL, "kind" character varying(50) NOT NULL DEFAULT 'review', "author_name" character varying(255) NOT NULL, "author_role" character varying(255), "author_company" character varying(255), "avatar_url" character varying(500), "client_logo_url" character varying(500), "rating" integer NOT NULL DEFAULT 5, "content" text, "source_platform" character varying(50), "is_featured" boolean NOT NULL DEFAULT false, "display_order" integer NOT NULL DEFAULT 0, "is_active" boolean NOT NULL DEFAULT true, "is_deleted" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_testimonials_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "partners" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "logo_url" character varying(500), "website_url" character varying(500), "sector" character varying(100), "partnership_type" character varying(50), "description" text, "is_active" boolean NOT NULL DEFAULT true, "display_order" integer NOT NULL DEFAULT 0, "is_deleted" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_partners_id" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "partners"`);
        await queryRunner.query(`DROP TABLE "testimonials"`);
    }
}
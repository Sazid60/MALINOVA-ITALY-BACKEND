import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMilanovaSiteTables1789797157214 implements MigrationInterface {
    name = 'AddMilanovaSiteTables1789797157214'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "technologies" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "icon_url" character varying(500), "category" character varying(100) NOT NULL DEFAULT 'Frontend', "proficiency_tagline" character varying(255), "display_order" integer NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9a97465b79568f00becacdd4e4a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "company_settings" ("id" SERIAL NOT NULL, "legal_company_name" character varying(255) NOT NULL DEFAULT 'Milanova Technologies S.R.L.', "brand_name" character varying(255) NOT NULL DEFAULT 'Milanova Technologies', "mission_purpose" text, "incorporation_details" text, "eu_standards_badge_info" text, "primary_headquarters_address" text, "branch_addresses" jsonb, "official_emails" jsonb, "official_phones" jsonb, "social_links" jsonb, "calendly_url" character varying(500), "core_cta_objective" character varying(100) NOT NULL DEFAULT 'Book Consultation', "target_monthly_lead_capacity" integer NOT NULL DEFAULT '100', "target_geographies" jsonb, "ideal_client_persona_focus" text, "priority_focus_offerings" jsonb, "secondary_conversion_events" jsonb, "ga4_measurement_id" character varying(100), "gtm_container_id" character varying(100), "meta_pixel_id" character varying(100), "custom_head_scripts" text, "custom_body_scripts" text, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_036b4634217db79c17305442dbe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sitemap_config" ("id" SERIAL NOT NULL, "robots_disallow" jsonb, "robots_allow" jsonb, "sitemap_url" character varying(500), "priority_mappings" jsonb, "change_frequencies" jsonb, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cb1c9b5eaaa088b7333facf92a9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "seo_metadata" ("id" SERIAL NOT NULL, "page_path" character varying(255) NOT NULL, "meta_title" character varying(255), "meta_description" text, "keywords" jsonb, "canonical_url" character varying(500), "og_title" character varying(255), "og_description" text, "og_image" character varying(500), "twitter_card" character varying(50) NOT NULL DEFAULT 'summary_large_image', "schema_json_ld" jsonb, "default_image_alt" character varying(255), "internal_link_targets" jsonb, "no_index" boolean NOT NULL DEFAULT false, "no_follow" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8efb3ebacc169776222a2128b94" UNIQUE ("page_path"), CONSTRAINT "PK_fcf814530fb2cd86a321cc134df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "redirect_rules" ("id" SERIAL NOT NULL, "source_path" character varying(255) NOT NULL, "target_path" character varying(255) NOT NULL, "status_code" integer NOT NULL DEFAULT '301', "hit_count" integer NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_9cc59bab560b45c3bdbdadc1e70" UNIQUE ("source_path"), CONSTRAINT "PK_9f570ba7a90a48cd9d6f4a4962c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_modules" ("id" SERIAL NOT NULL, "product_id" integer NOT NULL, "module_name" character varying(255) NOT NULL, "overview" text, "core_capability" text, "supporting_media" character varying(500), "sort_order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_13289cb413de667995c7ef9d5cc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "products_saas" ("id" SERIAL NOT NULL, "product_name" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "brand_logo" character varying(500), "category" character varying(100) NOT NULL DEFAULT 'Software Engineering', "industry_focus" jsonb, "deployment_options" jsonb, "status_badge" character varying(100) NOT NULL DEFAULT 'Ready to Deploy', "tags" jsonb, "live_demo_url" character varying(500), "sandbox_url" character varying(500), "app_store_url" character varying(500), "documentation_url" character varying(500), "is_featured" boolean NOT NULL DEFAULT false, "cover_image" character varying(500), "primary_challenge" text, "primary_solution" text, "enable_explore_solution" boolean NOT NULL DEFAULT true, "enable_request_demo" boolean NOT NULL DEFAULT true, "tech_specs" jsonb, "integrations" jsonb, "meta_title" character varying(255), "meta_description" text, "keywords" jsonb, "canonical_url" character varying(500), "custom_og_image" character varying(500), "no_index" boolean NOT NULL DEFAULT false, "no_follow" boolean NOT NULL DEFAULT false, "comparison_enabled" boolean NOT NULL DEFAULT true, "comparison_title" character varying(255) NOT NULL DEFAULT 'Traditional / Manual Method vs. Our Product', "comparison_rows" jsonb, "pricing_enabled" boolean NOT NULL DEFAULT true, "pricing_title" character varying(255) NOT NULL DEFAULT 'Transparent Pricing & Subscription Models', "pricing_tiers" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7d2f424dc430c8e7dcd0a23b5a0" UNIQUE ("slug"), CONSTRAINT "PK_db7b5c63c5273670ed0d3203c23" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "portfolio_challenges" ("id" SERIAL NOT NULL, "portfolio_id" integer NOT NULL, "title" character varying(255) NOT NULL, "challenge_description" text, "solution_provided" text, "supporting_image" character varying(500), "sort_order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_81dd282acaad79670ff3947c00b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "portfolio_pricing_tiers" ("id" SERIAL NOT NULL, "portfolio_id" integer NOT NULL, "title" character varying(255) NOT NULL, "currencies" jsonb, "primary_price" character varying(100) NOT NULL, "regional_prices" jsonb, "price_subtitle" character varying(255), "deliverables" jsonb, "badge_text" character varying(100), "cta_label" character varying(255), "cta_link" character varying(500), "is_most_popular" boolean NOT NULL DEFAULT false, "sort_order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0fb5f37f865045ad9a25a07c488" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "portfolios" ("id" SERIAL NOT NULL, "project_name" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "client_name" character varying(255), "client_logo" character varying(500), "category" character varying(100) NOT NULL, "tags" jsonb, "live_url" character varying(500), "app_store_url" character varying(500), "play_store_url" character varying(500), "is_featured" boolean NOT NULL DEFAULT false, "cover_image" character varying(500), "primary_challenge" text, "primary_solution" text, "comparison_enabled" boolean NOT NULL DEFAULT true, "comparison_title" character varying(255) NOT NULL DEFAULT 'Industry Standard vs. Our Approach', "industry_standard_text" text, "our_approach_text" text, "pricing_enabled" boolean NOT NULL DEFAULT true, "pricing_title" character varying(255) NOT NULL DEFAULT 'Transparent Pricing & Engagement Models', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_12dbd2f8ab84bdd495d6989618e" UNIQUE ("slug"), CONSTRAINT "PK_488aa6e9b219d1d9087126871ae" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "lead_trial_assets" ("id" SERIAL NOT NULL, "lead_id" integer NOT NULL, "file_name" character varying(255) NOT NULL, "original_name" character varying(255) NOT NULL, "file_path" character varying(500) NOT NULL, "file_size" integer, "file_type" character varying(50), "sort_order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_12a6892cdd32f97fe3ce85c03ef" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "lead_communication_logs" ("id" SERIAL NOT NULL, "lead_id" integer NOT NULL, "admin_user_id" integer, "notes" text NOT NULL, "contacted_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_daa86180b7393906375ba6bff1f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "leads" ("id" SERIAL NOT NULL, "type" character varying(50) NOT NULL DEFAULT 'Inquiry', "full_name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "mobile_prefix" character varying(50), "mobile_number" character varying(50), "company_name" character varying(255), "designation" character varying(255), "message" text, "calendly_slot" jsonb, "service_requirements" jsonb, "return_file_format" character varying(50), "detailed_instructions" text, "want_commercial_quote" boolean NOT NULL DEFAULT false, "status" character varying(50) NOT NULL DEFAULT 'New', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cd102ed7a9a4ca7d4d8bfeba406" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "applicant_activity_logs" ("id" SERIAL NOT NULL, "applicant_id" integer NOT NULL, "changed_by_user_id" integer, "old_status" character varying(100), "new_status" character varying(100) NOT NULL, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_223a249d13dae148df95ec1bb4b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "job_applicants" ("id" SERIAL NOT NULL, "job_id" integer NOT NULL, "source_channel" character varying(100) NOT NULL DEFAULT 'Website Form', "full_name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "mobile_prefix" character varying(50), "mobile_number" character varying(50), "current_company" character varying(255), "designation" character varying(255), "linkedin_url" character varying(500), "resume_url" character varying(500) NOT NULL, "cover_letter" text, "status" character varying(100) NOT NULL DEFAULT 'New', "applied_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6ab3b674abead4b3f9295a610e3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "jobs" ("id" SERIAL NOT NULL, "title" character varying(255) NOT NULL, "employment_type" character varying(100) NOT NULL DEFAULT 'Full-Time', "department" character varying(100) NOT NULL DEFAULT 'Engineering', "location" character varying(100) NOT NULL DEFAULT 'Remote / Italy / Dhaka Hub', "deadline" date, "description_requirements" text NOT NULL, "status" character varying(50) NOT NULL DEFAULT 'Open', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cf0a6c42b72fcc7f7c237def345" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "low_stock_threshold"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "lifecycle_months"`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "excerpt" text`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "featured_image_alt" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "reading_time" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "category" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "tags" jsonb`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "primary_author_name" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "co_authors" jsonb`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "related_article_ids" jsonb`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "related_service_keys" jsonb`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "meta_title" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "meta_description" text`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "keywords" jsonb`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "canonical_url" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "custom_og_image" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "no_index" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "no_follow" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "testimonials" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "testimonials" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "testimonials" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "testimonials" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "partners" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "partners" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "partners" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "partners" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "product_modules" ADD CONSTRAINT "FK_b9bd01482b2a3c285fa96e306d3" FOREIGN KEY ("product_id") REFERENCES "products_saas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "portfolio_challenges" ADD CONSTRAINT "FK_a68b46a2efe645b6911f7b42869" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "portfolio_pricing_tiers" ADD CONSTRAINT "FK_3c6f8f4437c0c558089f13bae65" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lead_trial_assets" ADD CONSTRAINT "FK_ce95a22646d0178b0224d01371a" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lead_communication_logs" ADD CONSTRAINT "FK_cc2e1ca9dafa7ced3d655d6448c" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "applicant_activity_logs" ADD CONSTRAINT "FK_97b2031f4e690044e7e0ea19663" FOREIGN KEY ("applicant_id") REFERENCES "job_applicants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_applicants" ADD CONSTRAINT "FK_0fc3f3e10e6a47e49b9a8b0265e" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job_applicants" DROP CONSTRAINT "FK_0fc3f3e10e6a47e49b9a8b0265e"`);
        await queryRunner.query(`ALTER TABLE "applicant_activity_logs" DROP CONSTRAINT "FK_97b2031f4e690044e7e0ea19663"`);
        await queryRunner.query(`ALTER TABLE "lead_communication_logs" DROP CONSTRAINT "FK_cc2e1ca9dafa7ced3d655d6448c"`);
        await queryRunner.query(`ALTER TABLE "lead_trial_assets" DROP CONSTRAINT "FK_ce95a22646d0178b0224d01371a"`);
        await queryRunner.query(`ALTER TABLE "portfolio_pricing_tiers" DROP CONSTRAINT "FK_3c6f8f4437c0c558089f13bae65"`);
        await queryRunner.query(`ALTER TABLE "portfolio_challenges" DROP CONSTRAINT "FK_a68b46a2efe645b6911f7b42869"`);
        await queryRunner.query(`ALTER TABLE "product_modules" DROP CONSTRAINT "FK_b9bd01482b2a3c285fa96e306d3"`);
        await queryRunner.query(`ALTER TABLE "partners" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "partners" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "partners" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "partners" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "testimonials" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "testimonials" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "testimonials" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "testimonials" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "no_follow"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "no_index"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "custom_og_image"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "canonical_url"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "keywords"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "meta_description"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "meta_title"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "related_service_keys"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "related_article_ids"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "co_authors"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "primary_author_name"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "tags"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "category"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "reading_time"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "featured_image_alt"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "excerpt"`);
        await queryRunner.query(`ALTER TABLE "products" ADD "lifecycle_months" integer NOT NULL DEFAULT '6'`);
        await queryRunner.query(`ALTER TABLE "products" ADD "low_stock_threshold" integer NOT NULL DEFAULT '10'`);
        await queryRunner.query(`DROP TABLE "jobs"`);
        await queryRunner.query(`DROP TABLE "job_applicants"`);
        await queryRunner.query(`DROP TABLE "applicant_activity_logs"`);
        await queryRunner.query(`DROP TABLE "leads"`);
        await queryRunner.query(`DROP TABLE "lead_communication_logs"`);
        await queryRunner.query(`DROP TABLE "lead_trial_assets"`);
        await queryRunner.query(`DROP TABLE "portfolios"`);
        await queryRunner.query(`DROP TABLE "portfolio_pricing_tiers"`);
        await queryRunner.query(`DROP TABLE "portfolio_challenges"`);
        await queryRunner.query(`DROP TABLE "products_saas"`);
        await queryRunner.query(`DROP TABLE "product_modules"`);
        await queryRunner.query(`DROP TABLE "redirect_rules"`);
        await queryRunner.query(`DROP TABLE "seo_metadata"`);
        await queryRunner.query(`DROP TABLE "sitemap_config"`);
        await queryRunner.query(`DROP TABLE "company_settings"`);
        await queryRunner.query(`DROP TABLE "technologies"`);
    }

}

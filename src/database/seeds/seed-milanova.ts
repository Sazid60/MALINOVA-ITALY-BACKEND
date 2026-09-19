import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../data-source';
import { CompanySetting } from '../../settings/entities/company-setting.entity';
import { Technology } from '../../settings/entities/technology.entity';
import { Portfolio } from '../../portfolio/entities/portfolio.entity';
import { PortfolioChallenge } from '../../portfolio/entities/portfolio-challenge.entity';
import { PortfolioPricingTier } from '../../portfolio/entities/portfolio-pricing-tier.entity';
import { ProductSaas } from '../../products-saas/entities/product-saas.entity';
import { ProductModule } from '../../products-saas/entities/product-module.entity';
import { Job } from '../../careers/entities/job.entity';
import { Lead } from '../../leads/entities/lead.entity';
import { seedAdminRbac } from './admin-seed.helper';

const AppDataSource = new DataSource({ ...dataSourceOptions, synchronize: false });

async function seedMilanoVAData() {
  console.log('--- Initializing MilanoVA Database Seeder ---');
  await AppDataSource.initialize();

  const companyRepo = AppDataSource.getRepository(CompanySetting);
  const techRepo = AppDataSource.getRepository(Technology);
  const portfolioRepo = AppDataSource.getRepository(Portfolio);
  const productSaasRepo = AppDataSource.getRepository(ProductSaas);
  const jobRepo = AppDataSource.getRepository(Job);
  const leadRepo = AppDataSource.getRepository(Lead);

  // 1. Company Settings
  const existingSetting = await companyRepo.findOne({ where: { id: 1 } });
  if (!existingSetting) {
    await companyRepo.save({
      id: 1,
      legal_company_name: 'Milanova Technologies S.R.L.',
      brand_name: 'Milanova Technologies',
      mission_purpose: 'To build simple, scalable, and secure digital products that empower businesses to operate efficiently and grow without technical friction.',
      incorporation_details: 'Italy Registered, REA MI-2049182',
      eu_standards_badge_info: 'GDPR Compliant · ISO 27001 Certified Architecture',
      primary_headquarters_address: 'Via Montenapoleone 8, 20121 Milan, Italy',
      branch_addresses: [
        { city: 'Milan', country: 'Italy', address: 'Via Montenapoleone 8, 20121 Milan', phone: '+39 02 1234 5678' },
        { city: 'Dhaka', country: 'Bangladesh', address: 'Gulshan 2, Dhaka 1212', phone: '+880 1700 000000' },
      ],
      official_emails: {
        general: 'info@milanovatech.com',
        support: 'support@milanovatech.com',
        sales: 'sales@milanovatech.com',
        careers: 'careers@milanovatech.com',
      },
      official_phones: { phone: '+39 02 1234 5678', whatsapp: '+39 340 000 0000', country_code: '+39' },
      social_links: {
        linkedin: 'https://linkedin.com/company/milanova-technologies',
        facebook: 'https://facebook.com/milanovatech',
        twitter: 'https://x.com/milanovatech',
        github: 'https://github.com/milanovatech',
        youtube: 'https://youtube.com/@milanovatech',
      },
      calendly_url: 'https://calendly.com/milanova-tech/30min',
    });
    console.log(' ✓ Company settings seeded');
  }

  // 2. Sample Technologies
  const countTech = await techRepo.count();
  if (countTech === 0) {
    await techRepo.save([
      { name: 'Next.js 15', category: 'Frontend', proficiency_tagline: 'Enterprise Standard', display_order: 1 },
      { name: 'React 19', category: 'Frontend', proficiency_tagline: 'Modern UI', display_order: 2 },
      { name: '.NET 9 Core', category: 'Backend', proficiency_tagline: 'High Throughput', display_order: 3 },
      { name: 'NestJS / TypeScript', category: 'Backend', proficiency_tagline: 'Clean Architecture', display_order: 4 },
      { name: 'PostgreSQL', category: 'Database', proficiency_tagline: 'ACID Relational DB', display_order: 5 },
      { name: 'AWS Cloud', category: 'Cloud', proficiency_tagline: 'Cloud-Native', display_order: 6 },
      { name: 'Docker / K8s', category: 'DevOps', proficiency_tagline: 'Containerized Pipelines', display_order: 7 },
      { name: 'Claude & Cursor API', category: 'AI & Automation', proficiency_tagline: 'AI Code & Agents', display_order: 8 },
      { name: 'Flutter', category: 'Mobile', proficiency_tagline: 'Cross-Platform', display_order: 9 },
      { name: 'Capture One / Photoshop', category: 'Image Tune', proficiency_tagline: 'Commercial Retouching', display_order: 10 },
    ]);
    console.log(' ✓ Technologies stack seeded');
  }

  // 3. Sample Case Study / Portfolio
  const countPortfolio = await portfolioRepo.count();
  if (countPortfolio === 0) {
    await portfolioRepo.save({
      project_name: 'GasPay Centralized Utility Platform',
      slug: 'gaspay-centralized-utility',
      client_name: 'Enel Gas & Utility EU',
      category: 'Software Engineering',
      tags: ['.NET Core', 'AWS', 'Next.js', 'PostgreSQL'],
      live_url: 'https://gaspay.demo.milanovatech.com',
      is_featured: true,
      cover_image: '/images/portfolio/gaspay-cover.png',
      primary_challenge: 'Legacy monolithic utility billing engine was causing 12+ second latency during end-of-month meter reading submissions for over 500,000 customers.',
      primary_solution: 'Re-architected legacy core into an event-driven microservices architecture using NestJS, PostgreSQL read-replicas, and a modern Next.js dashboard.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Monolithic architecture, 12s latency, high operational bottlenecks, manual error handling.',
      our_approach_text: 'Event-driven microservices, sub-second response, automated CI/CD pipelines, 99.9% uptime SLA.',
      pricing_enabled: true,
      pricing_title: 'Transparent Engagement Models',
      challenges: [
        {
          title: 'Challenge 1: High Latency in Meter Ingestion',
          challenge_description: 'Synchronous DB locks during peak hours caused connection pool exhaustion.',
          solution_provided: 'Implemented Redis message queue buffer with async batch ingestion workers.',
          sort_order: 1,
        },
      ],
      pricing_tiers: [
        {
          title: 'Starter Package',
          currencies: ['USD', 'BDT', 'EUR'],
          primary_price: '$5,000',
          regional_prices: { BDT: '৳500,000', EUR: '€4,500' },
          price_subtitle: 'One-time MVP delivery',
          deliverables: ['Core API setup', 'Next.js dashboard', 'Database schema', 'Documentation'],
          is_most_popular: false,
          sort_order: 1,
        },
        {
          title: 'Enterprise Growth',
          currencies: ['USD', 'BDT', 'EUR'],
          primary_price: '$15,000',
          regional_prices: { BDT: '৳1,500,000', EUR: '€13,500' },
          price_subtitle: 'Full product lifecycle',
          deliverables: ['Microservices architecture', 'AWS multi-region K8s', '24/7 SLA Support', 'Security Audits'],
          is_most_popular: true,
          sort_order: 2,
        },
      ],
    });
    console.log(' ✓ Sample portfolio case study seeded');
  }

  // 4. Sample SaaS Product
  const countProductSaas = await productSaasRepo.count();
  if (countProductSaas === 0) {
    await productSaasRepo.save({
      product_name: 'Milanova Enterprise ERP Engine',
      slug: 'milanova-enterprise-erp',
      category: 'Software Engineering',
      industry_focus: ['Utilities & Energy', 'eCommerce & Retail', 'Healthcare'],
      deployment_options: ['Cloud SaaS', 'On-Premise', 'Hybrid'],
      status_badge: 'Ready to Deploy',
      tags: ['ERP', 'Automation', 'Cloud SaaS'],
      is_featured: true,
      cover_image: '/images/products/erp-mockup.png',
      primary_challenge: 'Fragmented operations across disparate HR, inventory, and billing modules.',
      primary_solution: 'Unified single-pane operational control plane with real-time analytics and workflow automation.',
      enable_explore_solution: true,
      enable_request_demo: true,
      tech_specs: ['.NET 9 Core', 'PostgreSQL', 'AES-256 Encryption', 'GDPR Compliant'],
      modules: [
        {
          module_name: 'Automated Billing & Invoicing Engine',
          overview: 'Real-time invoice generation and multi-currency payment gateway integrations.',
          core_capability: 'Supports recurring subscriptions, automated reminders, and tax compliance across EU & US.',
          sort_order: 1,
        },
      ],
    });
    console.log(' ✓ Sample SaaS product seeded');
  }

  // 5. Sample Job Circular
  const countJobs = await jobRepo.count();
  if (countJobs === 0) {
    await jobRepo.save({
      title: 'Senior .NET & Cloud Architect',
      employment_type: 'Full-Time',
      department: 'Engineering',
      location: 'Remote / Italy / Dhaka Hub',
      description_requirements: '<p>We are seeking a Senior .NET Architect with expertise in NestJS, TypeORM, PostgreSQL, and AWS K8s.</p>',
      status: 'Open',
    });
    console.log(' ✓ Sample job circular seeded');
  }

  // 6. Admin user + RBAC (idempotent)
  await seedAdminRbac(AppDataSource);
  console.log(' ✓ Admin & RBAC seeded');

  await AppDataSource.destroy();
  console.log('--- MilanoVA Database Seeder Completed Successfully ---');
}

seedMilanoVAData().catch((err) => {
  console.error('Seeder failed:', err);
  process.exit(1);
});

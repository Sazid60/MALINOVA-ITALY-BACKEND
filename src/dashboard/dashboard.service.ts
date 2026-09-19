import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Lead } from '../leads/entities/lead.entity';
import { Job } from '../careers/entities/job.entity';
import { JobApplicant } from '../careers/entities/job-applicant.entity';
import { Blog } from '../cms/blog.entity';
import { Portfolio } from '../portfolio/entities/portfolio.entity';
import { ProductSaas } from '../products-saas/entities/product-saas.entity';
import { Testimonial } from '../testimonials/entities/testimonial.entity';
import { Partner } from '../partners/entities/partner.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Lead) private leadRepo: Repository<Lead>,
    @InjectRepository(Job) private jobRepo: Repository<Job>,
    @InjectRepository(JobApplicant) private applicantRepo: Repository<JobApplicant>,
    @InjectRepository(Blog) private blogRepo: Repository<Blog>,
    @InjectRepository(Portfolio) private portfolioRepo: Repository<Portfolio>,
    @InjectRepository(ProductSaas) private productRepo: Repository<ProductSaas>,
    @InjectRepository(Testimonial) private testimonialRepo: Repository<Testimonial>,
    @InjectRepository(Partner) private partnerRepo: Repository<Partner>,
  ) {}

  async getTodayStats() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      totalLeads,
      newLeadsToday,
      openJobs,
      totalApplicants,
      publishedBlogs,
      portfolioProjects,
      solutionsCount,
      testimonialsCount,
      partnersCount,
      totalUsers,
    ] = await Promise.all([
      this.leadRepo.count(),
      this.leadRepo
        .createQueryBuilder('l')
        .where('l.created_at >= :d', { d: startOfDay })
        .getCount(),
      this.jobRepo.count({ where: { status: 'Open' } }),
      this.applicantRepo.count(),
      this.blogRepo.count({ where: { is_deleted: false } }),
      this.portfolioRepo.count(),
      this.productRepo.count(),
      this.testimonialRepo.count({ where: { is_deleted: false } }),
      this.partnerRepo.count({ where: { is_deleted: false } }),
      this.userRepo.count({ where: { is_deleted: false } }),
    ]);

    const [recentLeads, recentApplicants] = await Promise.all([
      this.leadRepo.find({
        order: { created_at: 'DESC' },
        take: 5,
      }),
      this.applicantRepo.find({
        order: { applied_at: 'DESC' },
        take: 5,
      }),
    ]);

    return {
      totalLeads,
      newLeadsToday,
      openJobs,
      totalApplicants,
      publishedBlogs,
      portfolioProjects,
      solutionsCount,
      testimonialsCount,
      partnersCount,
      totalUsers,
      recentLeads,
      recentApplicants,
      systemStatus: 'healthy',
    };
  }

  async getExpiringBatches() {
    return [];
  }

  async getLowStockProducts() {
    return [];
  }

  async getTopSellingProducts() {
    return [];
  }

  async getRecentOrders() {
    return [];
  }

  async getSalesReport() {
    return [];
  }
}
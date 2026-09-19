import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from './entities/portfolio.entity';
import { PortfolioChallenge } from './entities/portfolio-challenge.entity';
import { PortfolioPricingTier } from './entities/portfolio-pricing-tier.entity';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(Portfolio)
    private portfolioRepo: Repository<Portfolio>,
    @InjectRepository(PortfolioChallenge)
    private challengeRepo: Repository<PortfolioChallenge>,
    @InjectRepository(PortfolioPricingTier)
    private tierRepo: Repository<PortfolioPricingTier>,
  ) {}

  async findAll(category?: string, search?: string, featuredOnly?: boolean) {
    const qb = this.portfolioRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.challenges', 'c')
      .leftJoinAndSelect('p.pricing_tiers', 't')
      .orderBy('p.created_at', 'DESC')
      .addOrderBy('c.sort_order', 'ASC')
      .addOrderBy('t.sort_order', 'ASC');

    if (category && category !== 'All Projects') {
      qb.andWhere('p.category ILIKE :category', { category: `%${category}%` });
    }

    if (featuredOnly) {
      qb.andWhere('p.is_featured = true');
    }

    if (search) {
      qb.andWhere('(p.project_name ILIKE :s OR p.primary_challenge ILIKE :s OR p.primary_solution ILIKE :s)', { s: `%${search}%` });
    }

    return qb.getMany();
  }

  async findBySlug(slug: string) {
    const item = await this.portfolioRepo.findOne({
      where: { slug },
      relations: ['challenges', 'pricing_tiers'],
      order: {
        challenges: { sort_order: 'ASC' },
        pricing_tiers: { sort_order: 'ASC' },
      },
    });
    if (!item) {
      throw new NotFoundException(`Portfolio item with slug "${slug}" not found`);
    }
    return item;
  }

  async create(data: Partial<Portfolio>) {
    const item = this.portfolioRepo.create(data);
    return this.portfolioRepo.save(item);
  }

  async update(id: number, data: Partial<Portfolio>) {
    await this.portfolioRepo.update(id, data);
    return this.portfolioRepo.findOne({
      where: { id },
      relations: ['challenges', 'pricing_tiers'],
    });
  }

  async remove(id: number) {
    const item = await this.portfolioRepo.findOneBy({ id });
    if (!item) throw new NotFoundException('Portfolio item not found');
    await this.portfolioRepo.remove(item);
    return { success: true };
  }
}

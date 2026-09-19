import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Technology } from './entities/technology.entity';
import { CompanySetting } from './entities/company-setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Technology)
    private techRepo: Repository<Technology>,
    @InjectRepository(CompanySetting)
    private companyRepo: Repository<CompanySetting>,
  ) {}

  // Technologies
  async findAllTechnologies(category?: string) {
    const qb = this.techRepo.createQueryBuilder('t')
      .where('t.is_active = true')
      .orderBy('t.display_order', 'ASC');

    if (category && category !== 'All') {
      qb.andWhere('t.category ILIKE :category', { category: `%${category}%` });
    }

    return qb.getMany();
  }

  async createTechnology(data: Partial<Technology>) {
    const tech = this.techRepo.create(data);
    return this.techRepo.save(tech);
  }

  async updateTechnology(id: number, data: Partial<Technology>) {
    await this.techRepo.update(id, data);
    return this.techRepo.findOneBy({ id });
  }

  async removeTechnology(id: number) {
    await this.techRepo.delete(id);
    return { success: true };
  }

  // Company Overview Settings
  async getCompanySettings() {
    let settings = await this.companyRepo.findOne({ where: { id: 1 } });
    if (!settings) {
      settings = this.companyRepo.create({
        id: 1,
        legal_company_name: 'Milanova Technologies S.R.L.',
        brand_name: 'Milanova Technologies',
        primary_headquarters_address: 'Via Rome 45, Milan, Italy',
        official_emails: { general: 'info@milanovatech.com', sales: 'sales@milanovatech.com' },
        calendly_url: 'https://calendly.com/milanova-tech/30min',
      });
      await this.companyRepo.save(settings);
    }
    return settings;
  }

  async updateCompanySettings(data: Partial<CompanySetting>) {
    let settings = await this.getCompanySettings();
    Object.assign(settings, data);
    return this.companyRepo.save(settings);
  }
}

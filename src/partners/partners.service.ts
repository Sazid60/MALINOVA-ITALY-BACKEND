import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Partner } from './entities/partner.entity';

@Injectable()
export class PartnersService {
  constructor(
    @InjectRepository(Partner)
    private readonly repo: Repository<Partner>,
  ) {}

  async findAll(sector?: string) {
    const qb = this.repo
      .createQueryBuilder('p')
      .where('p.is_deleted = false')
      .orderBy('p.display_order', 'ASC');

    if (sector && sector !== 'All') {
      qb.andWhere('p.sector ILIKE :sector', { sector: `%${sector}%` });
    }

    return qb.getMany();
  }

  async findAllPublic() {
    return this.repo.find({
      where: { is_active: true, is_deleted: false },
      order: { display_order: 'ASC' },
    });
  }

  async findOne(id: number) {
    const item = await this.repo.findOneBy({ id });
    if (!item || item.is_deleted) throw new NotFoundException('Partner not found');
    return item;
  }

  async create(data: Partial<Partner>) {
    const item = this.repo.create(data);
    return this.repo.save(item);
  }

  async update(id: number, data: Partial<Partner>) {
    const item = await this.findOne(id);
    Object.assign(item, data);
    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    item.is_deleted = true;
    await this.repo.save(item);
    return { success: true };
  }
}
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Testimonial } from './entities/testimonial.entity';

@Injectable()
export class TestimonialsService {
  constructor(
    @InjectRepository(Testimonial)
    private readonly repo: Repository<Testimonial>,
  ) {}

  async findAll(featuredOnly = false) {
    const qb = this.repo
      .createQueryBuilder('t')
      .where('t.is_deleted = false')
      .orderBy('t.is_featured', 'DESC')
      .addOrderBy('t.display_order', 'ASC');

    if (featuredOnly) {
      qb.andWhere('t.is_featured = true');
    }

    return qb.getMany();
  }

  async findAllPublic() {
    return this.repo.find({
      where: { is_active: true, is_deleted: false },
      order: { is_featured: 'DESC', display_order: 'ASC' },
    });
  }

  async findOne(id: number) {
    const item = await this.repo.findOneBy({ id });
    if (!item || item.is_deleted) throw new NotFoundException('Testimonial not found');
    return item;
  }

  async create(data: Partial<Testimonial>) {
    const item = this.repo.create(data);
    return this.repo.save(item);
  }

  async update(id: number, data: Partial<Testimonial>) {
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
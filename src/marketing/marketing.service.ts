import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon } from './coupon.entity';

@Injectable()
export class MarketingService {
  constructor(@InjectRepository(Coupon) private repo: Repository<Coupon>) {}

  // findAll() { return this.repo.find({ order: { valid_to: 'DESC' } }); }
  async findAll(page = 1, limit = 10) {
  const qb = this.repo.createQueryBuilder('coupon')
    .where('coupon.is_deleted = :is_deleted', { is_deleted: false });

  const [data, total] = await qb
    .orderBy('coupon.valid_to', 'DESC')
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
  };
}

  async findOne(id: number) {
    const c = await this.repo.findOne({ where: { id, is_deleted: false } });
    if (!c) throw new NotFoundException('Coupon not found');
    return c;
  }

  async create(dto: any) {
    const exists = await this.repo.findOne({ where: { code: dto.code, is_deleted: false } });
    if (exists) throw new BadRequestException('Coupon code already exists');
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: number, dto: any) {
    const c = await this.findOne(id);
    return this.repo.save({ ...c, ...dto });
  }

  async remove(id: number) {
    const c = await this.findOne(id);
    c.is_deleted = true;
    c.code = `${c.code}_deleted_${Date.now()}`;
    await this.repo.save(c);
    return { message: 'Coupon deleted' };
  }

  async validate(code: string, orderAmount: number) {
    if (!code || !code.trim()) {
      return { valid: false, reason: 'Please enter a coupon code', message: 'Please enter a coupon code' };
    }
    const cleanCode = code.trim().toUpperCase();
    const coupon = await this.repo.findOne({ where: { code: cleanCode, is_deleted: false } });
    if (!coupon) {
      return { valid: false, reason: `Coupon code '${cleanCode}' is invalid or does not exist`, message: `Coupon code '${cleanCode}' is invalid or does not exist` };
    }
    if (coupon.valid_to && new Date(coupon.valid_to) < new Date()) {
      return { valid: false, reason: `Coupon '${cleanCode}' has expired`, message: `Coupon '${cleanCode}' has expired` };
    }
    if (coupon.valid_from && new Date(coupon.valid_from) > new Date()) {
      return { valid: false, reason: `Coupon '${cleanCode}' is not active yet`, message: `Coupon '${cleanCode}' is not active yet` };
    }
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return { valid: false, reason: `Usage limit reached for coupon '${cleanCode}'`, message: `Usage limit reached for coupon '${cleanCode}'` };
    }
    if (orderAmount < (coupon.min_order_amount || 0)) {
      return {
        valid: false,
        reason: `Minimum order subtotal of ৳${Number(coupon.min_order_amount).toFixed(2)} required for coupon '${cleanCode}'`,
        message: `Minimum order subtotal of ৳${Number(coupon.min_order_amount).toFixed(2)} required for coupon '${cleanCode}'`,
      };
    }

    let discount = coupon.discount_type === 'fixed'
      ? Number(coupon.discount_value)
      : (orderAmount * Number(coupon.discount_value)) / 100;
    if (coupon.max_discount_amount) discount = Math.min(discount, Number(coupon.max_discount_amount));

    return { valid: true, coupon, discount_amount: Number(discount.toFixed(2)) };
  }
}

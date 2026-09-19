import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Lead } from './entities/lead.entity';
import { LeadTrialAsset } from './entities/lead-trial-asset.entity';
import { LeadCommunicationLog } from './entities/lead-communication-log.entity';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private leadRepo: Repository<Lead>,
    @InjectRepository(LeadTrialAsset)
    private assetRepo: Repository<LeadTrialAsset>,
    @InjectRepository(LeadCommunicationLog)
    private commRepo: Repository<LeadCommunicationLog>,
  ) {}

  async findAll(type?: string, status?: string, search?: string) {
    const qb = this.leadRepo.createQueryBuilder('l')
      .leftJoinAndSelect('l.trial_assets', 'a')
      .leftJoinAndSelect('l.communication_logs', 'c')
      .orderBy('l.created_at', 'DESC');

    if (type) {
      qb.andWhere('l.type = :type', { type });
    }

    if (status) {
      qb.andWhere('l.status = :status', { status });
    }

    if (search) {
      qb.andWhere('(l.full_name ILIKE :s OR l.email ILIKE :s OR l.company_name ILIKE :s)', { s: `%${search}%` });
    }

    return qb.getMany();
  }

  async findOne(id: number) {
    const lead = await this.leadRepo.findOne({
      where: { id },
      relations: ['trial_assets', 'communication_logs'],
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async createInquiry(data: Partial<Lead>) {
    const lead = this.leadRepo.create({ ...data, type: data.type || 'Inquiry' });
    return this.leadRepo.save(lead);
  }

  async createFreeTrial(data: Partial<Lead>, assets?: Array<{ file_name: string; original_name: string; file_path: string; file_size?: number; file_type?: string }>) {
    const lead = this.leadRepo.create({
      ...data,
      type: 'Free Trial',
    });
    const saved = await this.leadRepo.save(lead);

    if (assets && assets.length > 0) {
      const assetEntities = assets.map((a, idx) =>
        this.assetRepo.create({
          lead_id: saved.id,
          file_name: a.file_name,
          original_name: a.original_name,
          file_path: a.file_path,
          file_size: a.file_size,
          file_type: a.file_type,
          sort_order: idx,
        })
      );
      await this.assetRepo.save(assetEntities);
    }

    return this.findOne(saved.id);
  }

  async updateLead(id: number, data: Partial<Lead>) {
    const lead = await this.findOne(id);
    Object.assign(lead, data);
    await this.leadRepo.save(lead);
    return this.findOne(id);
  }

  async updateStatus(id: number, status: string, adminUserId?: number, notes?: string) {
    const lead = await this.findOne(id);
    lead.status = status;
    await this.leadRepo.save(lead);

    if (notes) {
      await this.commRepo.save({
        lead_id: id,
        admin_user_id: adminUserId,
        notes,
      });
    }

    return this.findOne(id);
  }

  async addNote(id: number, notes: string, adminUserId?: number) {
    await this.findOne(id);
    const log = await this.commRepo.save({
      lead_id: id,
      admin_user_id: adminUserId,
      notes,
    });
    return this.findOne(id);
  }

  async export(type?: string, status?: string, search?: string, format = 'xlsx') {
    const leads = await this.findAll(type, status, search);
    const rows = leads.map((l) => ({
      id: l.id,
      type: l.type,
      full_name: l.full_name,
      email: l.email,
      mobile_prefix: l.mobile_prefix,
      mobile_number: l.mobile_number,
      company_name: l.company_name,
      designation: l.designation,
      message: l.message,
      status: l.status,
      calendly_slot: l.calendly_slot ? JSON.stringify(l.calendly_slot) : '',
      service_requirements: l.service_requirements ? l.service_requirements.join(', ') : '',
      return_file_format: l.return_file_format,
      detailed_instructions: l.detailed_instructions,
      want_commercial_quote: l.want_commercial_quote ? 'Yes' : 'No',
      created_at: l.created_at?.toISOString(),
    }));

    const columns = [
      { header: 'ID', key: 'id', width: 6 },
      { header: 'Type', key: 'type', width: 14 },
      { header: 'Full Name', key: 'full_name', width: 22 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Mobile Prefix', key: 'mobile_prefix', width: 12 },
      { header: 'Mobile Number', key: 'mobile_number', width: 16 },
      { header: 'Company', key: 'company_name', width: 24 },
      { header: 'Designation', key: 'designation', width: 18 },
      { header: 'Message', key: 'message', width: 40 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Calendly Slot', key: 'calendly_slot', width: 30 },
      { header: 'Service Requirements', key: 'service_requirements', width: 40 },
      { header: 'Return Format', key: 'return_file_format', width: 14 },
      { header: 'Detailed Instructions', key: 'detailed_instructions', width: 40 },
      { header: 'Want Commercial Quote', key: 'want_commercial_quote', width: 20 },
      { header: 'Created At', key: 'created_at', width: 24 },
    ];

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Leads');
    ws.columns = columns as any;
    rows.forEach((r) => ws.addRow(r));

    if (format === 'csv') {
      const buffer = await wb.csv.writeBuffer();
      return { buffer: Buffer.from(buffer), mime: 'text/csv', ext: 'csv' };
    }

    const buffer = await wb.xlsx.writeBuffer();
    return {
      buffer: Buffer.from(buffer),
      mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ext: 'xlsx',
    };
  }

  async remove(id: number) {
    const lead = await this.findOne(id);
    await this.leadRepo.remove(lead);
    return { success: true };
  }
}
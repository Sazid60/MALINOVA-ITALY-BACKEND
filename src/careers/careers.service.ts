import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Job } from './entities/job.entity';
import { JobApplicant } from './entities/job-applicant.entity';
import { ApplicantActivityLog } from './entities/applicant-activity-log.entity';

@Injectable()
export class CareersService {
  constructor(
    @InjectRepository(Job)
    private jobRepo: Repository<Job>,
    @InjectRepository(JobApplicant)
    private applicantRepo: Repository<JobApplicant>,
    @InjectRepository(ApplicantActivityLog)
    private activityRepo: Repository<ApplicantActivityLog>,
  ) {}

  // Jobs CRUD
  async findAllJobs(openOnly?: boolean) {
    const qb = this.jobRepo.createQueryBuilder('j')
      .orderBy('j.created_at', 'DESC');

    if (openOnly) {
      qb.andWhere('j.status = :status', { status: 'Open' });
    }

    return qb.getMany();
  }

  async findJobById(id: number) {
    const job = await this.jobRepo.findOneBy({ id });
    if (!job) throw new NotFoundException('Job circular not found');
    return job;
  }

  async createJob(data: Partial<Job>) {
    const job = this.jobRepo.create(data);
    return this.jobRepo.save(job);
  }

  async updateJob(id: number, data: Partial<Job>) {
    await this.jobRepo.update(id, data);
    return this.findJobById(id);
  }

  async removeJob(id: number) {
    const job = await this.findJobById(id);
    await this.jobRepo.remove(job);
    return { success: true };
  }

  // ATS Candidate Management
  async findAllApplicants(jobId?: number, channel?: string, status?: string, search?: string) {
    const qb = this.applicantRepo.createQueryBuilder('a')
      .leftJoinAndSelect('a.job', 'j')
      .leftJoinAndSelect('a.activity_logs', 'logs')
      .orderBy('a.applied_at', 'DESC');

    if (jobId) {
      qb.andWhere('a.job_id = :jobId', { jobId });
    }

    if (channel) {
      qb.andWhere('a.source_channel = :channel', { channel });
    }

    if (status) {
      qb.andWhere('a.status = :status', { status });
    }

    if (search) {
      qb.andWhere('(a.full_name ILIKE :s OR a.email ILIKE :s OR a.mobile_number ILIKE :s)', { s: `%${search}%` });
    }

    return qb.getMany();
  }

  async createApplicant(data: Partial<JobApplicant>) {
    const applicant = this.applicantRepo.create(data);
    const saved = await this.applicantRepo.save(applicant);

    // Initial log
    await this.activityRepo.save({
      applicant_id: saved.id,
      old_status: null,
      new_status: saved.status || 'New',
      notes: `Application received via ${saved.source_channel}`,
    });

    return saved;
  }

  async updateApplicantStatus(id: number, newStatus: string, userId?: number, notes?: string) {
    const applicant = await this.applicantRepo.findOneBy({ id });
    if (!applicant) throw new NotFoundException('Applicant not found');

    const oldStatus = applicant.status;
    applicant.status = newStatus;
    await this.applicantRepo.save(applicant);

    await this.activityRepo.save({
      applicant_id: id,
      changed_by_user_id: userId,
      old_status: oldStatus,
      new_status: newStatus,
      notes: notes || `Status changed from ${oldStatus} to ${newStatus}`,
    });

    return this.applicantRepo.findOne({
      where: { id },
      relations: ['activity_logs', 'job'],
    });
  }

  async exportApplicants(jobId?: number, channel?: string, status?: string, search?: string, format = 'xlsx') {
    const applicants = await this.findAllApplicants(jobId, channel, status, search);
    const rows = applicants.map((a) => ({
      id: a.id,
      job_id: a.job_id,
      job_title: a.job?.title ?? '',
      full_name: a.full_name,
      email: a.email,
      mobile_prefix: a.mobile_prefix,
      mobile_number: a.mobile_number,
      current_company: a.current_company,
      designation: a.designation,
      linkedin_url: a.linkedin_url,
      source_channel: a.source_channel,
      status: a.status,
      applied_at: a.applied_at?.toISOString(),
      cover_letter: a.cover_letter,
    }));

    const columns = [
      { header: 'ID', key: 'id', width: 6 },
      { header: 'Job ID', key: 'job_id', width: 8 },
      { header: 'Job Title', key: 'job_title', width: 28 },
      { header: 'Full Name', key: 'full_name', width: 22 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Mobile Prefix', key: 'mobile_prefix', width: 12 },
      { header: 'Mobile Number', key: 'mobile_number', width: 16 },
      { header: 'Current Company', key: 'current_company', width: 24 },
      { header: 'Designation', key: 'designation', width: 20 },
      { header: 'LinkedIn URL', key: 'linkedin_url', width: 40 },
      { header: 'Source Channel', key: 'source_channel', width: 18 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Applied At', key: 'applied_at', width: 24 },
      { header: 'Cover Letter', key: 'cover_letter', width: 50 },
    ];

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Applicants');
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
}

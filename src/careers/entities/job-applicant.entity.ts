import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Job } from './job.entity';
import { ApplicantActivityLog } from './applicant-activity-log.entity';

@Entity('job_applicants')
export class JobApplicant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  job_id: number;

  @ManyToOne(() => Job, (job) => job.applicants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column({ type: 'varchar', length: 100, default: 'Website Form' })
  source_channel: string; // 'Website Form' | 'LinkedIn Direct' | 'Email / Inbox' | 'Employee Referral' | 'BDJobs' | 'Facebook' | 'Headhunter'

  @Column({ type: 'varchar', length: 255 })
  full_name: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  mobile_prefix: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  mobile_number: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  current_company: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  designation: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  linkedin_url: string;

  @Column({ type: 'varchar', length: 500 })
  resume_url: string;

  @Column({ type: 'text', nullable: true })
  cover_letter: string;

  @Column({ type: 'varchar', length: 100, default: 'New' })
  status: string; // 'New' | 'Shortlisted' | 'Interview Scheduled' | 'Technical Audit' | 'Offer Sent' | 'Hired' | 'Rejected'

  @OneToMany(() => ApplicantActivityLog, (log) => log.applicant, { cascade: true })
  activity_logs: ApplicantActivityLog[];

  @CreateDateColumn()
  applied_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

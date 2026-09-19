import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { JobApplicant } from './job-applicant.entity';

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 100, default: 'Full-Time' })
  employment_type: string; // 'Full-Time' | 'Part-Time' | 'Remote' | 'Contract' | 'Internship'

  @Column({ type: 'varchar', length: 100, default: 'Engineering' })
  department: string; // 'Engineering' | 'Creative' | 'Growth' | 'Operations' | 'Marketing'

  @Column({ type: 'varchar', length: 100, default: 'Remote / Italy / Dhaka Hub' })
  location: string;

  @Column({ type: 'date', nullable: true })
  deadline: Date;

  @Column({ type: 'text' })
  description_requirements: string;

  @Column({ type: 'varchar', length: 50, default: 'Open' })
  status: string; // 'Draft' | 'Open' | 'Closed' | 'Archived'

  @OneToMany(() => JobApplicant, (applicant) => applicant.job)
  applicants: JobApplicant[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

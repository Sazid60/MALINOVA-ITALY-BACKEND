import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { JobApplicant } from './job-applicant.entity';

@Entity('applicant_activity_logs')
export class ApplicantActivityLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  applicant_id: number;

  @ManyToOne(() => JobApplicant, (applicant) => applicant.activity_logs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicant_id' })
  applicant: JobApplicant;

  @Column({ type: 'int', nullable: true })
  changed_by_user_id: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  old_status: string;

  @Column({ type: 'varchar', length: 100 })
  new_status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;
}

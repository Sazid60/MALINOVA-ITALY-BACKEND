import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { LeadTrialAsset } from './lead-trial-asset.entity';
import { LeadCommunicationLog } from './lead-communication-log.entity';

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, default: 'Inquiry' })
  type: string; // 'Inquiry' | 'Consultation' | 'Free Trial'

  @Column({ type: 'varchar', length: 255 })
  full_name: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  mobile_prefix: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  mobile_number: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  company_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  designation: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  // Consultation slot
  @Column({ type: 'jsonb', nullable: true })
  calendly_slot: { date?: string; time?: string; url?: string };

  // Free trial post-production specifications
  @Column({ type: 'jsonb', nullable: true })
  service_requirements: string[]; // ['Clipping Path', 'Shadow Adding', 'Background Removal', 'Photo Retouching', ...]

  @Column({ type: 'varchar', length: 50, nullable: true })
  return_file_format: string; // 'PSD' | 'JPG' | 'PNG' | 'TIFF' | 'PDF'

  @Column({ type: 'text', nullable: true })
  detailed_instructions: string;

  @Column({ type: 'boolean', default: false })
  want_commercial_quote: boolean;

  // Status & Logs
  @Column({ type: 'varchar', length: 50, default: 'New' })
  status: string; // 'New' | 'Contacted' | 'In Progress' | 'Closed' | 'Rejected'

  @OneToMany(() => LeadTrialAsset, (asset) => asset.lead, { cascade: true })
  trial_assets: LeadTrialAsset[];

  @OneToMany(() => LeadCommunicationLog, (log) => log.lead, { cascade: true })
  communication_logs: LeadCommunicationLog[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Lead } from './lead.entity';

@Entity('lead_trial_assets')
export class LeadTrialAsset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  lead_id: number;

  @ManyToOne(() => Lead, (lead) => lead.trial_assets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @Column({ type: 'varchar', length: 255 })
  file_name: string;

  @Column({ type: 'varchar', length: 255 })
  original_name: string;

  @Column({ type: 'varchar', length: 500 })
  file_path: string;

  @Column({ type: 'int', nullable: true })
  file_size: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  file_type: string; // 'RAW' | 'JPG' | 'PNG' | 'PSD' | 'TIFF'

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @CreateDateColumn()
  created_at: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Lead } from './lead.entity';

@Entity('lead_communication_logs')
export class LeadCommunicationLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  lead_id: number;

  @ManyToOne(() => Lead, (lead) => lead.communication_logs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @Column({ type: 'int', nullable: true })
  admin_user_id: number;

  @Column({ type: 'text' })
  notes: string;

  @CreateDateColumn()
  contacted_at: Date;
}

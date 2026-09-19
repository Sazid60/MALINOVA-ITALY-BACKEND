import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';

@Entity('notification_channels')
export class NotificationChannel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20, unique: true })
  code: string; // e.g. 'sms'

  @Column({ length: 50 })
  name: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('notification_events')
export class NotificationEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  event_code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 30 })
  category: string; // 'order' | 'cancel' | 'return' | 'delivery' | 'payment' | 'otp'

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('notification_templates')
@Unique(['event_id', 'channel_id', 'language'])
export class NotificationTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  event_id: number;

  @ManyToOne(() => NotificationEvent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: NotificationEvent;

  @Column()
  channel_id: number;

  @ManyToOne(() => NotificationChannel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'channel_id' })
  channel: NotificationChannel;

  @Column({ length: 10, default: 'en' })
  language: string;

  @Column({ length: 100, nullable: true })
  title: string;

  @Column({ type: 'text' })
  body_template: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('notification_logs')
export class NotificationLog {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ length: 100 })
  event_code: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ length: 20, default: 'sent' })
  status: string; // sent | failed | skipped

  @Column({ type: 'text', nullable: true })
  error: string;

  @Column({ type: 'bigint', nullable: true })
  order_id: number;

  @Column({ type: 'bigint', nullable: true })
  customer_id: number;

  @CreateDateColumn()
  created_at: Date;
}

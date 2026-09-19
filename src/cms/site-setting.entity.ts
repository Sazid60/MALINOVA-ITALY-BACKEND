import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('site_settings')
export class SiteSetting {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' }) id: number;
  @Column({ type: 'varchar', length: 100, unique: true }) key: string;
  @Column({ type: 'text', nullable: true }) value: string;
}

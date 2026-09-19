import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Portfolio } from './portfolio.entity';

@Entity('portfolio_challenges')
export class PortfolioChallenge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  portfolio_id: number;

  @ManyToOne(() => Portfolio, (portfolio) => portfolio.challenges, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'portfolio_id' })
  portfolio: Portfolio;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  challenge_description: string;

  @Column({ type: 'text', nullable: true })
  solution_provided: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  supporting_image: string;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

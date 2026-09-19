import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { User } from './user.entity';
import { Permission } from '../roles/permission.entity';

@Entity('user_permissions')
@Index('idx_user_perm_user_id', ['user_id'])
@Index('idx_user_perm_permission_id', ['permission_id'])
@Index('idx_user_perm_user_allowed', ['user_id', 'allowed'])
export class UserPermission {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  user_id: number;

  @Column({ type: 'bigint' })
  permission_id: number;

  @Column({ type: 'boolean', default: true })
  allowed: boolean;

  @Column({ type: 'boolean', default: false })
  inherited_from_role: boolean;

  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;

  @ManyToOne(() => User, (u) => u.userPermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Permission, (p) => p.userPermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;
}

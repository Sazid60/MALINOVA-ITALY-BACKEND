import { Injectable, NotFoundException, ConflictException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Role } from './role.entity';
import { Permission } from './permission.entity';
import { RolePermission } from './role-permission.entity';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { AuthService } from '../auth/auth.service';
import { seedAdminRbac } from '../database/seeds/admin-seed.helper';

@Injectable()
export class RolesService implements OnModuleInit {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(Permission) private permRepo: Repository<Permission>,
    @InjectRepository(RolePermission) private rpRepo: Repository<RolePermission>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    try {
      await seedAdminRbac(this.dataSource);
    } catch (err: any) {
      this.logger.error('Failed to sync RBAC permissions on init:', err.message || err);
    }
  }

  async findAllRoles(page?: number, limit?: number) {
    const where = { is_deleted: false };
    if (page && limit) {
      const [data, total] = await this.roleRepo.findAndCount({
        where,
        order: { name: 'ASC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return { data, total, page, limit };
    }
    return this.roleRepo.find({ where, order: { name: 'ASC' } });
  }

  async findRole(id: number) {
    const r = await this.roleRepo.findOne({ where: { id, is_deleted: false } });
    if (!r) throw new NotFoundException('Role not found');
    return r;
  }

  async createRole(dto: { name: string; description?: string }) {
    const exists = await this.roleRepo.findOne({ where: { name: dto.name, is_deleted: false } });
    if (exists) throw new ConflictException('Role name already exists');
    return this.roleRepo.save(this.roleRepo.create(dto));
  }

  async updateRole(id: number, dto: any) {
    const role = await this.findRole(id);
    return this.roleRepo.save({ ...role, ...dto });
  }

  async deleteRole(id: number) {
    const role = await this.findRole(id);
    role.is_deleted = true;
    role.name = `${role.name}_deleted_${Date.now()}`;
    await this.roleRepo.save(role);
    PermissionsGuard.invalidateRoleCache(id);
    AuthService.invalidateRoleProfileCache(id);
    return { message: 'Role deleted' };
  }

  // Permissions CRUD
  async findAllPermissions(module?: string, page?: number, limit?: number) {
    const where = module ? { module } : {};
    if (page && limit) {
      const [data, total] = await this.permRepo.findAndCount({
        where,
        order: { module: 'ASC', code: 'ASC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return { data, total, page, limit };
    }
    return this.permRepo.find({ where, order: { module: 'ASC', code: 'ASC' } });
  }

  async createPermission(dto: { code: string; description?: string; module: string }) {
    const exists = await this.permRepo.findOne({ where: { code: dto.code } });
    if (exists) throw new ConflictException('Permission code already exists');
    return this.permRepo.save(this.permRepo.create(dto));
  }

  // Role-permission assignments
  async getRolePermissions(roleId: number) {
    return this.rpRepo.find({ where: { role_id: roleId }, relations: ['permission'] });
  }

  async setRolePermissions(roleId: number, permissionIds: number[]) {
    await this.rpRepo.delete({ role_id: roleId });
    const entities = permissionIds.map((pid) =>
      this.rpRepo.create({ role_id: roleId, permission_id: pid }),
    );
    const saved = await this.rpRepo.save(entities);
    PermissionsGuard.invalidateRoleCache(roleId);
    AuthService.invalidateRoleProfileCache(roleId);
    return saved;
  }
}

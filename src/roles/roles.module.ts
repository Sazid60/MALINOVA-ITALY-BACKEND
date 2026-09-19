// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { RolesController } from './roles.controller';
// import { RolesService } from './roles.service';
// import { Role } from './role.entity';
// import { Permission } from './permission.entity';
// import { RolePermission } from './role-permission.entity';

// @Module({
//   imports: [TypeOrmModule.forFeature([Role, Permission, RolePermission])],
//   controllers: [RolesController],
//   providers: [RolesService],
//   exports: [RolesService],
// })
// export class RolesModule {}


import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { Role } from './role.entity';
import { Permission } from './permission.entity';
import { RolePermission } from './role-permission.entity';
import { UserPermission } from '../users/user-permission.entity';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission, RolePermission, UserPermission])],
  controllers: [RolesController],
  providers: [RolesService, PermissionsGuard],
  exports: [RolesService, PermissionsGuard],
})
export class RolesModule {}
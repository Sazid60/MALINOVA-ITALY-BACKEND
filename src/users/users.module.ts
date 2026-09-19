// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { UsersController } from './users.controller';
// import { UsersService } from './users.service';
// import { User } from './user.entity';
// import { UserPermission } from './user-permission.entity';
// import { Role } from '../roles/role.entity';

// @Module({
//   imports: [TypeOrmModule.forFeature([User, UserPermission, Role])],
//   controllers: [UsersController],
//   providers: [UsersService],
//   exports: [UsersService],
// })
// export class UsersModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { UserPermission } from './user-permission.entity';
import { Role } from '../roles/role.entity';
import { RolePermission } from '../roles/role-permission.entity';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserPermission, Role, RolePermission])],
  controllers: [UsersController],
  providers: [UsersService, PermissionsGuard],
  exports: [UsersService, PermissionsGuard],
})
export class UsersModule {}
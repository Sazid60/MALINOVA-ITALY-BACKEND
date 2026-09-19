import {
  Controller, Get, Post, Put, Patch, Delete, Param, Body,
  UseGuards, Query, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions, RequireAnyPermissions } from '../common/decorators/require-permissions.decorator';
import { RolesService } from './roles.service';

@ApiTags('Roles & Permissions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class RolesController {
  constructor(private svc: RolesService) {}

  @Get('roles')
  @RequireAnyPermissions('settings.roles.view', 'settings.roles.manage', 'settings.users.view', 'settings.users.manage')
  @ApiOperation({ summary: 'List all roles' })
  findRoles(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) { return this.svc.findAllRoles(page ? +page : undefined, limit ? +limit : undefined); }

  @Get('roles/:id')
  @RequireAnyPermissions('settings.roles.view', 'settings.roles.manage')
  @ApiOperation({ summary: 'Get a singular role' })
  findRole(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findRole(id);
  }

  @Post('roles')
  @RequirePermissions('settings.roles.manage')
  createRole(@Body() body: { name: string; description?: string }) {
    return this.svc.createRole(body);
  }

  @Patch('roles/:id')
  @RequirePermissions('settings.roles.manage')
  updateRole(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.svc.updateRole(id, body);
  }

  @Delete('roles/:id')
  @RequirePermissions('settings.roles.manage')
  deleteRole(@Param('id', ParseIntPipe) id: number) { return this.svc.deleteRole(id); }

  @Get('roles/:id/permissions')
  @RequireAnyPermissions('settings.roles.view', 'settings.roles.manage', 'settings.users.view', 'settings.users.manage')
  @ApiOperation({ summary: 'Get permissions assigned to a role' })
  getRolePermissions(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getRolePermissions(id);
  }

  @Post('roles/:id/permissions')
  @RequirePermissions('settings.roles.manage')
  @ApiOperation({ summary: 'Assign permissions to a role' })
  setRolePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { permission_ids: number[] },
  ) {
    return this.svc.setRolePermissions(id, body.permission_ids);
  }

  @Get('permissions')
  @RequireAnyPermissions('settings.permissions.view', 'settings.permissions.manage', 'settings.roles.view', 'settings.roles.manage', 'settings.users.view', 'settings.users.manage')
  @ApiOperation({ summary: 'List all permissions (filter by module)' })
  findPermissions(
    @Query('module') module?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.svc.findAllPermissions(module, page ? +page : undefined, limit ? +limit : undefined);
  }

  @Post('permissions')
  @RequirePermissions('settings.permissions.manage')
  createPermission(@Body() body: { code: string; description?: string; module: string }) {
    return this.svc.createPermission(body);
  }
}

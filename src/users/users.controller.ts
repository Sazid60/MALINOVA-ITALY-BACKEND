// import {
//   Controller, Get, Post, Put, Delete, Param, Body,
//   UseGuards, Query, ParseIntPipe,
// } from '@nestjs/common';
// import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
// import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
// import { UsersService } from './users.service';
// import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';

// @ApiTags('Users')
// @ApiBearerAuth('JWT-auth')
// @UseGuards(JwtAuthGuard)
// @Controller('users')
// export class UsersController {
//   constructor(private svc: UsersService) {}

//   @Get()
//   @ApiOperation({ summary: 'List all users (paginated)' })
//   @ApiQuery({ name: 'page', required: false })
//   @ApiQuery({ name: 'limit', required: false })
//   @ApiQuery({ name: 'search', required: false })
//   findAll(@Query('page') page = 1, @Query('limit') limit = 20, @Query('search') search?: string) {
//     return this.svc.findAll(+page, +limit, search);
//   }

//   @Get(':id')
//   findOne(@Param('id', ParseIntPipe) id: number) { return this.svc.findOne(id); }

//   @Post()
//   create(@Body() dto: CreateUserDto) { return this.svc.create(dto); }

//   @Put(':id')
//   update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
//     return this.svc.update(id, dto);
//   }

//   @Delete(':id')
//   remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id); }

//   @Get(':id/permissions')
//   @ApiOperation({ summary: 'Get user-level permission overrides' })
//   getPermissions(@Param('id', ParseIntPipe) id: number) {
//     return this.svc.getUserPermissions(id);
//   }

//   @Post(':id/permissions')
//   @ApiOperation({ summary: 'Set user-level permission overrides' })
//   setPermissions(
//     @Param('id', ParseIntPipe) id: number,
//     @Body() body: { permissions: { permission_id: number; allowed: boolean }[] },
//   ) {
//     return this.svc.setUserPermissions(id, body.permissions);
//   }
// }


// import {
//   Controller, Get, Post, Put, Delete, Param, Body,
//   UseGuards, Query, ParseIntPipe,
// } from '@nestjs/common';
// import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
// import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
// import { PermissionsGuard } from '../common/guards/permissions.guard';
// import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
// import { UsersService } from './users.service';
// import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';

// @ApiTags('Users')
// @ApiBearerAuth('JWT-auth')
// @UseGuards(JwtAuthGuard, PermissionsGuard)  // ← দুটো guard একসাথে
// @Controller('users')
// export class UsersController {
//   constructor(private svc: UsersService) {}

//   @Get()
//   @RequirePermissions('users.view')
//   @ApiOperation({ summary: 'List all users (paginated)' })
//   @ApiQuery({ name: 'page', required: false })
//   @ApiQuery({ name: 'limit', required: false })
//   @ApiQuery({ name: 'search', required: false })
//   findAll(
//     @Query('page') page = 1,
//     @Query('limit') limit = 20,
//     @Query('search') search?: string,
//   ) {
//     return this.svc.findAll(+page, +limit, search);
//   }

//   @Get(':id')
//   @RequirePermissions('users.view')
//   @ApiOperation({ summary: 'Get single user' })
//   findOne(@Param('id', ParseIntPipe) id: number) {
//     return this.svc.findOne(id);
//   }

//   @Post()
//   @RequirePermissions('users.create')
//   @ApiOperation({ summary: 'Create a new user' })
//   create(@Body() dto: CreateUserDto) {
//     return this.svc.create(dto);
//   }

//   @Put(':id')
//   @RequirePermissions('users.edit')
//   @ApiOperation({ summary: 'Update a user' })
//   update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
//     return this.svc.update(id, dto);
//   }

//   @Delete(':id')
//   @RequirePermissions('users.delete')
//   @ApiOperation({ summary: 'Delete a user' })
//   remove(@Param('id', ParseIntPipe) id: number) {
//     return this.svc.remove(id);
//   }

//   @Get(':id/permissions')
//   @RequirePermissions('users.view')
//   @ApiOperation({ summary: 'Get user-level permission overrides' })
//   getPermissions(@Param('id', ParseIntPipe) id: number) {
//     return this.svc.getUserPermissions(id);
//   }

//   @Post(':id/permissions')
//   @RequirePermissions('users.edit')
//   @ApiOperation({ summary: 'Set user-level permission overrides' })
//   setPermissions(
//     @Param('id', ParseIntPipe) id: number,
//     @Body() body: { permissions: { permission_id: number; allowed: boolean }[] },
//   ) {
//     return this.svc.setUserPermissions(id, body.permissions);
//   }
// }


import {
  Controller, Get, Post, Put, Patch, Delete, Param, Body,
  UseGuards, Query, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions, RequireAnyPermissions } from '../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private svc: UsersService) { }

  @Get()
  @RequireAnyPermissions('settings.users.view', 'settings.users.manage')
  @ApiOperation({ summary: 'List all users (paginated)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.svc.findAll(+page, +limit, search);
  }

  @Get(':id')
  @RequireAnyPermissions('settings.users.view', 'settings.users.manage')
  @ApiOperation({ summary: 'Get single user' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Post()
  @RequirePermissions('settings.users.manage')
  @ApiOperation({ summary: 'Create a new user' })
  create(
    @CurrentUser() actor: User,
    @Body() dto: CreateUserDto,
  ) {
    return this.svc.create(actor, dto);
  }

  @Patch(':id')
  @RequirePermissions('settings.users.manage')
  @ApiOperation({ summary: 'Update a user' })
  update(
    @CurrentUser() actor: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.svc.update(actor, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('settings.users.manage')
  @ApiOperation({ summary: 'Delete a user' })
  remove(
    @CurrentUser() actor: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.svc.remove(actor, id);
  }

  @Get(':id/permissions')
  @RequireAnyPermissions('settings.users.view', 'settings.users.manage')
  @ApiOperation({ summary: 'Get user-level permission overrides' })
  getPermissions(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getUserPermissions(id);
  }

  @Post(':id/permissions')
  @RequirePermissions('settings.users.manage')
  @ApiOperation({ summary: 'Set user-level permission overrides' })
  setPermissions(
    @CurrentUser() actor: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { permissions: { permission_id: number; allowed: boolean }[] },
  ) {
    return this.svc.setUserPermissions(actor, id, body.permissions);
  }
}
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import {
  NotificationChannel,
  NotificationEvent,
  NotificationTemplate,
  NotificationLog,
} from './notification.entity';
import { RolePermission } from '../roles/role-permission.entity';
import { UserPermission } from '../users/user-permission.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationChannel,
      NotificationEvent,
      NotificationTemplate,
      NotificationLog,
      RolePermission,
      UserPermission,
    ]),
    ConfigModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}

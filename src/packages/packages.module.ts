import { Module } from '@nestjs/common';
import { PackagesController } from './packages.controller';
import { PackagesService } from './packages.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PackageNotificationService } from './services/package-notification.service';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    NotificationsModule
  ],
  controllers: [PackagesController],
  providers: [PackagesService, PackageNotificationService],
  exports: [PackagesService, PackageNotificationService]
})
export class PackagesModule {} 
// attendance.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from '@wyecare-monorepo/api/core';
import { AuthorizationModule } from '../authorization/authorization.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { AttendanceController } from './controllers/attendance.controller';
import { AttendanceService } from './services/attendance.service';
import { OrganizationLinkingService } from '../organizations/services/organization-linking.service';
import { EmailService } from 'libs/shared/utils/src/lib/services/email.service';
import { NotificationService } from 'libs/shared/utils/src/lib/services/notification.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [CoreModule, OrganizationsModule, AuthorizationModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}

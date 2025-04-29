// super-admin/super-admin.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizationInvitationController } from './controllers/organization-invitation.controller';
import { OrganizationInvitationService } from './services/organization-invitation.service';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { JwtModule } from '@nestjs/jwt';
import { EmailService } from 'libs/shared/utils/src/lib/services/email.service';
import { AuthorizationService } from '../authorization/services/authorization.service';
import { AuthorizationModule } from '../authorization/authorization.module';
import { CoreModule } from '@wyecare-monorepo/core';
import { SuperAdminPermissionsController } from './controllers/permissions.controller';
import { SuperAdminPermissionsService } from './services/super-admin-permissions.service';

@Module({
  imports: [
    CoreModule,
    JwtModule.register({
      secret: process.env['JWT_SECRET'],
      signOptions: { expiresIn: '1d' },
    }),

    AuthorizationModule,
  ],
  controllers: [
    OrganizationInvitationController,
    SuperAdminPermissionsController,
  ],
  providers: [
    OrganizationInvitationService,
    SuperAdminGuard,
    EmailService,
    SuperAdminPermissionsService,
  ],
  exports: [OrganizationInvitationService],
})
export class SuperAdminModule {}

import { Module } from '@nestjs/common';
import { CoreModule } from '@wyecare-monorepo/api/core';
import { AuthorizationModule } from '../authorization/authorization.module';
import { OrganizationsController } from './controllers/organizations.controller';
import { OrganizationStaffController } from './controllers/organization-staff.controller';
import { OrganizationLinkingController } from './controllers/organization-linking.controller';
import { OrganizationInvitationController } from './controllers/organization-invitation.controller';
import { OrganizationsService } from './services/organizations.service';
import { OrganizationStaffService } from './services/organization-staff.service';
import { OrganizationLinkingService } from './services/organization-linking.service';
import { OrganizationInvitationService } from './services/organization-invitation.service';
import { UtilsModule } from '@wyecare-monorepo/shared-utils';
import { OrganizationContextGuard } from './organization-context.guard';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    CoreModule,
    UtilsModule,
    AuthorizationModule,
    JwtModule.register({
      secret: process.env['JWT_SECRET'],
      signOptions: { expiresIn: '60m' },
    }),
  ],
  controllers: [
    OrganizationsController,
    OrganizationStaffController,
    OrganizationLinkingController,
    OrganizationInvitationController,
  ],
  providers: [
    OrganizationsService,
    OrganizationStaffService,
    OrganizationLinkingService,
    OrganizationInvitationService,
    OrganizationContextGuard,
  ],
  exports: [
    OrganizationsService,
    OrganizationStaffService,
    OrganizationLinkingService,
    OrganizationInvitationService,
    OrganizationContextGuard,
  ],
})
export class OrganizationsModule {}

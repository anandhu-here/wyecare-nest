// super-admin/super-admin.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizationInvitationController } from './controllers/organization-invitation.controller';
import { OrganizationInvitationService } from './services/organization-invitation.service';
import {
  OrganizationCreationInvitation,
  OrganizationCreationInvitationSchema,
} from './schemas/organization-creation-invitation.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { JwtModule } from '@nestjs/jwt';
import { EmailService } from 'libs/shared/utils/src/lib/services/email.service';
import {
  UserMetadata,
  UserMetadataSchema,
} from './schemas/user-metadata.schema';
import { AuthorizationService } from '../authorization/services/authorization.service';
import { AuthorizationModule } from '../authorization/authorization.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: OrganizationCreationInvitation.name,
        schema: OrganizationCreationInvitationSchema,
      },
      { name: User.name, schema: UserSchema },
      {
        name: UserMetadata.name,
        schema: UserMetadataSchema,
      },
    ]),
    JwtModule.register({
      secret: process.env['JWT_SECRET'],
      signOptions: { expiresIn: '1d' },
    }),

    AuthorizationModule,
  ],
  controllers: [OrganizationInvitationController],
  providers: [OrganizationInvitationService, SuperAdminGuard, EmailService],
  exports: [OrganizationInvitationService],
})
export class SuperAdminModule {}

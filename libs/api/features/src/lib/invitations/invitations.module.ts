import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  StaffInvitation,
  StaffInvitationSchema,
} from './schemas/staff-invitation.schema';
import {
  OrganizationCreationInvitation,
  OrganizationCreationInvitationSchema,
} from './schemas/organization-creation-invitation.schema';
import { InvitationService } from './services/invitation.service';
import { EventsModule } from '../events/events.module';
import { UtilsModule } from '@wyecare-monorepo/shared-utils';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StaffInvitation.name, schema: StaffInvitationSchema },
      {
        name: OrganizationCreationInvitation.name,
        schema: OrganizationCreationInvitationSchema,
      },
    ]),
    EventsModule,
    UtilsModule,
  ],
  providers: [InvitationService],
  exports: [InvitationService],
})
export class InvitationsModule {}

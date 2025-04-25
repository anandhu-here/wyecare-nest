import { Module } from '@nestjs/common';
import { CoreModule } from '@wyecare-monorepo/api/core';
import { InvitationService } from './services/invitation.service';
import { EventsModule } from '../events/events.module';
import { UtilsModule } from '@wyecare-monorepo/shared-utils';

@Module({
  imports: [
    CoreModule, // Import CoreModule instead of using MongooseModule.forFeature
    EventsModule,
    UtilsModule,
  ],
  providers: [InvitationService],
  exports: [InvitationService],
})
export class InvitationsModule {}

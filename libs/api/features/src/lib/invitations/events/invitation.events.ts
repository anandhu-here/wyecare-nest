// libs/api/features/src/lib/invitations/events/invitation.events.ts
import { Types } from 'mongoose';
import { Event } from '../../events/interfaces/event.interface';

export class StaffInvitationAcceptedEvent
  implements Event<StaffInvitationAcceptedPayload>
{
  readonly type = 'staff-invitation.accepted';
  readonly timestamp = new Date();
  readonly payload: StaffInvitationAcceptedPayload;

  constructor(
    public readonly token: string,
    public readonly userId: Types.ObjectId
  ) {
    this.payload = { token, userId };
  }
}

export class OrganizationInvitationAcceptedEvent
  implements Event<OrganizationInvitationAcceptedPayload>
{
  readonly type = 'organization-invitation.accepted';
  readonly timestamp = new Date();
  readonly payload: OrganizationInvitationAcceptedPayload;

  constructor(
    public readonly token: string,
    public readonly userId: Types.ObjectId
  ) {
    this.payload = { token, userId };
  }
}

// Payload interfaces
interface StaffInvitationAcceptedPayload {
  token: string;
  userId: Types.ObjectId;
}

interface OrganizationInvitationAcceptedPayload {
  token: string;
  userId: Types.ObjectId;
}

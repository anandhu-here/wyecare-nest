import { Document, Schema as MongooseSchema } from 'mongoose';

// Main StaffInvitation interface
export interface IStaffInvitation {
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  organizationId: MongooseSchema.Types.ObjectId;
  token: string;
  expiresAt: Date;
  invitedBy: MongooseSchema.Types.ObjectId;
  acceptedAt?: Date;
  acceptedBy?: MongooseSchema.Types.ObjectId;
  status: 'pending' | 'accepted' | 'expired';
  message?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Document interface that extends the base interface with Mongoose Document properties
export interface IStaffInvitationDocument extends IStaffInvitation, Document {}

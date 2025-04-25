import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type UserNotificationDocument = UserNotification & Document;

@Schema({ _id: false })
class RelatedEntity {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  entityId!: MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: [
      'SHIFT',
      'TIMESHEET',
      'PAYMENT',
      'USER',
      'ORGANIZATION',
      'LEAVE_REQUEST',
    ],
  })
  entityType!: string;
}

@Schema({ timestamps: true })
export class UserNotification {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user!: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @Prop({ type: String, required: true, trim: true })
  message!: string;

  @Prop({ type: String, required: true })
  type!: string;

  @Prop({ type: Boolean, default: false, index: true })
  isRead!: boolean;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  metadata?: Record<string, any>;

  @Prop({ type: String, default: null })
  apiCallEndpoint?: string;

  @Prop({ type: [RelatedEntity], default: [] })
  relatedEntities?: RelatedEntity[];

  @Prop({ type: Date, default: null })
  readAt?: Date;

  @Prop({
    type: Date,
    default: () => {
      const date = new Date();
      date.setDate(date.getDate() + 30); // Default 30 days expiry
      return date;
    },
    index: true,
  })
  expiresAt?: Date;
}

export const UserNotificationSchema =
  SchemaFactory.createForClass(UserNotification);

// Add indexes
UserNotificationSchema.index({ user: 1, createdAt: -1 }); // For fetching user's notifications sorted by date
UserNotificationSchema.index({ user: 1, isRead: 1 }); // For fetching unread notifications
UserNotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for automatic deletion

// In NestJS, methods and statics are typically moved to services
// But we can still add them if needed for direct model usage
// In NestJS, methods and statics are typically moved to services
// But we can still add them if needed for direct model usage
UserNotificationSchema.methods['markAsRead'] =
  async function (): Promise<void> {
    this['isRead'] = true;
    this['readAt'] = new Date();
    await this['save']();
  };

// Static methods
// Static methods
UserNotificationSchema.statics['getUnreadCount'] = async function (
  userId: string
): Promise<number> {
  return this.countDocuments({ user: userId, isRead: false });
};

UserNotificationSchema.statics['markAllAsRead'] = async function (
  userId: string
): Promise<void> {
  const now = new Date();
  await this.updateMany(
    { user: userId, isRead: false },
    {
      $set: {
        isRead: true,
        readAt: now,
      },
    }
  );
};

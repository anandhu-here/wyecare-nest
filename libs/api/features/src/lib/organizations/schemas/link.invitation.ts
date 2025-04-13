import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type LinkInvitationDocument = LinkInvitation & Document;

@Schema({ timestamps: true })
export class LinkInvitation {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  })
  sourceOrganization!: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
  })
  targetOrganization?: MongooseSchema.Types.ObjectId;

  @Prop()
  targetEmail?: string;

  @Prop({ default: 'default' })
  linkType?: string;

  @Prop()
  message?: string;

  @Prop()
  notes?: string;

  @Prop({
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  })
  status!: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  createdBy!: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
  })
  respondedBy?: MongooseSchema.Types.ObjectId;

  @Prop()
  respondedAt?: Date;
}

export const LinkInvitationSchema =
  SchemaFactory.createForClass(LinkInvitation);

// Add indexes
LinkInvitationSchema.index({
  sourceOrganization: 1,
  targetOrganization: 1,
  status: 1,
});
LinkInvitationSchema.index({
  sourceOrganization: 1,
  targetEmail: 1,
  status: 1,
});
LinkInvitationSchema.index({ targetOrganization: 1 });
LinkInvitationSchema.index({ status: 1 });

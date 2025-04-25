import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type OrganizationLinkDocument = OrganizationLink & Document;

@Schema({ timestamps: true })
export class OrganizationLink {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  })
  sourceOrganization!: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  })
  targetOrganization!: MongooseSchema.Types.ObjectId;

  @Prop({ default: 'default' })
  linkType?: string;

  @Prop()
  notes?: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  createdBy!: MongooseSchema.Types.ObjectId;
}

export const OrganizationLinkSchema =
  SchemaFactory.createForClass(OrganizationLink);

// Add indexes
OrganizationLinkSchema.index(
  { sourceOrganization: 1, targetOrganization: 1 },
  { unique: true }
);
OrganizationLinkSchema.index({ sourceOrganization: 1 });
OrganizationLinkSchema.index({ targetOrganization: 1 });

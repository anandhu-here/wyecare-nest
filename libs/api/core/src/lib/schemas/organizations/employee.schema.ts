import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type EmployeeAvailabilityDocument = EmployeeAvailability & Document;

// Define the nested schema for availability entries
@Schema({ _id: false })
class AvailabilityEntry {
  @Prop({ required: true })
  date!: Date;

  @Prop({ required: true, enum: ['day', 'night', 'both'] })
  period!: 'day' | 'night' | 'both';
}

// Main schema for employee availability
@Schema({ timestamps: true })
export class EmployeeAvailability {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user!: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  })
  organization!: MongooseSchema.Types.ObjectId;

  @Prop({ type: [AvailabilityEntry], required: true })
  availabilityEntries!: AvailabilityEntry[];

  @Prop({ required: true, default: Date.now })
  effectiveFrom!: Date;

  @Prop()
  effectiveTo?: Date;

  @Prop({ default: false })
  isRecurring!: boolean;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  createdBy!: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  updatedBy!: MongooseSchema.Types.ObjectId;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  isTestData?: boolean;
}

export const EmployeeAvailabilitySchema =
  SchemaFactory.createForClass(EmployeeAvailability);

// Add indexes for better query performance
EmployeeAvailabilitySchema.index({ user: 1, organization: 1 });
EmployeeAvailabilitySchema.index({ user: 1 });
EmployeeAvailabilitySchema.index({ organization: 1 });
EmployeeAvailabilitySchema.index({ 'availabilityEntries.date': 1 });
EmployeeAvailabilitySchema.index({ isActive: 1 });
EmployeeAvailabilitySchema.index({ effectiveFrom: 1, effectiveTo: 1 });

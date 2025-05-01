// shift-type.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ShiftTypeDocument = ShiftType & Document;

export enum OrganizationCategory {
  HOSPITAL = 'hospital',
  CARE_HOME = 'care_home',
  HEALTHCARE = 'healthcare',
  HOSPITALITY = 'hospitality',
  RETAIL = 'retail',
  MANUFACTURING = 'manufacturing',
  SERVICE_PROVIDER = 'service_provider',
  EDUCATION = 'education',
  PROFESSIONAL_SERVICES = 'professional_services',
  OTHER = 'other',
}

@Schema({ _id: false })
export class ShiftTiming {
  @Prop({ type: String, required: true })
  startTime!: string;

  @Prop({ type: String, required: true })
  endTime!: string;

  @Prop({ type: Number })
  durationMinutes?: number;

  @Prop({ type: Boolean, default: false })
  isOvernight!: boolean;
}

@Schema({ timestamps: true })
export class ShiftType {
  @Prop({ required: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop({ required: true, enum: Object.values(OrganizationCategory) })
  category!: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  })
  organizationId!: MongooseSchema.Types.ObjectId;

  @Prop({ type: ShiftTiming })
  defaultTiming?: ShiftTiming;

  @Prop({ default: '#3B82F6' }) // Default color - blue
  color?: string;

  @Prop({ default: 'clock' }) // Default icon
  icon?: string;

  @Prop({ default: true })
  isActive: boolean | undefined;

  @Prop({ type: [String] })
  applicableDays?: string[]; // e.g., ['Monday', 'Tuesday', ...]

  @Prop({ type: Object })
  metadata?: Record<string, any>; // Category-specific data
}

export const ShiftTypeSchema = SchemaFactory.createForClass(ShiftType);

// Add indexes
ShiftTypeSchema.index({ organizationId: 1 });
ShiftTypeSchema.index({ category: 1 });
ShiftTypeSchema.index({ name: 1, organizationId: 1 }, { unique: true });

// libs/api/features/src/lib/shifts/schemas/shift-template.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { OrganizationCategory } from './shift-type.schema';

export type ShiftTemplateDocument = ShiftTemplate & Document;

@Schema({ _id: false })
export class ShiftTimingTemplate {
  @Prop({ type: String, required: true })
  startTime!: string;

  @Prop({ type: String, required: true })
  endTime!: string;

  @Prop({ type: Number })
  durationMinutes?: number;

  @Prop({ type: Boolean, default: false })
  isOvernight!: boolean;
}

@Schema({ _id: false })
export class QualificationRequirement {
  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: Boolean, default: true })
  isRequired!: boolean;

  @Prop({ type: String })
  level?: string;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Qualification' }],
  })
  acceptedQualifications?: MongooseSchema.Types.ObjectId[];
}

@Schema({ timestamps: true })
export class ShiftTemplate {
  @Prop({ required: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop({ required: true, enum: Object.values(OrganizationCategory) })
  category!: string;

  @Prop()
  subCategory?: string;

  @Prop({ type: ShiftTimingTemplate, required: true })
  defaultTiming!: ShiftTimingTemplate;

  @Prop({
    type: [String],
    default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  })
  applicableDays!: string[];

  @Prop({ default: '#3B82F6' })
  color?: string;

  @Prop({ default: 'clock' })
  icon?: string;

  @Prop({ type: [QualificationRequirement] })
  qualificationRequirements?: QualificationRequirement[];

  @Prop({
    type: String,
    default: 'hourly',
    enum: [
      'hourly',
      'per_shift',
      'daily',
      'weekly',
      'monthly',
      'performance',
      'commission',
      'custom',
    ],
  })
  defaultPaymentMethod!: string;

  @Prop({ type: Object })
  defaultPaymentConfig?: Record<string, any>;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ type: Boolean, default: false })
  isSystem!: boolean; // Indicates if this is a system-provided template
}

export const ShiftTemplateSchema = SchemaFactory.createForClass(ShiftTemplate);

// Add indexes
ShiftTemplateSchema.index({ category: 1 });
ShiftTemplateSchema.index({ subCategory: 1 });
ShiftTemplateSchema.index({ isSystem: 1 });
ShiftTemplateSchema.index({ name: 1, category: 1 }, { unique: true });

// libs/api/features/src/lib/shifts/schemas/scheduling-rule.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { OrganizationCategory } from './shift-type.schema';

export type SchedulingRuleDocument = SchedulingRule & Document;

export enum RuleType {
  REST_PERIOD = 'rest_period',
  MAX_CONSECUTIVE_SHIFTS = 'max_consecutive_shifts',
  MAX_HOURS_PERIOD = 'max_hours_period',
  MIN_HOURS_PERIOD = 'min_hours_period',
  QUALIFICATION_REQUIREMENT = 'qualification_requirement',
  STAFFING_LEVEL = 'staffing_level',
  TIME_BETWEEN_SHIFTS = 'time_between_shifts',
  OVERTIME_THRESHOLD = 'overtime_threshold',
  CUSTOM = 'custom',
}

export enum RuleSeverity {
  WARNING = 'warning',
  ERROR = 'error',
  INFO = 'info',
}

export enum RuleScope {
  ORGANIZATION = 'organization',
  DEPARTMENT = 'department',
  ROLE = 'role',
  STAFF = 'staff',
  SHIFT_TYPE = 'shift_type',
}

@Schema({ _id: false })
export class RuleCondition {
  @Prop({ type: String, required: true })
  field!: string;

  @Prop({ type: String, required: true })
  operator!: string; // 'eq', 'gt', 'lt', 'contains', etc.

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  value: any;

  @Prop({ type: String })
  logicalOperator?: 'AND' | 'OR'; // For combining with the next condition
}

@Schema({ timestamps: true })
export class SchedulingRule {
  @Prop({ required: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  })
  organizationId!: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, enum: Object.values(RuleType) })
  ruleType!: string;

  @Prop({
    required: true,
    enum: Object.values(RuleSeverity),
    default: RuleSeverity.WARNING,
  })
  severity!: string;

  @Prop({ required: true, enum: Object.values(RuleScope) })
  scope!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId })
  scopeEntityId?: MongooseSchema.Types.ObjectId; // ID of department, role, staff, or shift type

  @Prop({ type: String, enum: Object.values(OrganizationCategory) })
  category?: string;

  @Prop({ type: Object, required: true })
  parameters!: Record<string, any>; // Rule-specific parameters

  @Prop({ type: [RuleCondition] })
  conditions?: RuleCondition[]; // Additional conditions for when rule applies

  @Prop({ type: String })
  errorMessage?: string; // Custom message shown when rule is violated

  @Prop({ default: true })
  isActive: boolean = false;

  @Prop({ type: Boolean, default: false })
  isSystem: boolean = false; // Indicates if this is a system-provided rule

  @Prop({ type: Date })
  effectiveFrom?: Date;

  @Prop({ type: Date })
  effectiveTo?: Date;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const SchedulingRuleSchema =
  SchemaFactory.createForClass(SchedulingRule);

// Add indexes
SchedulingRuleSchema.index({ organizationId: 1 });
SchedulingRuleSchema.index({ ruleType: 1 });
SchedulingRuleSchema.index({ scope: 1 });
SchedulingRuleSchema.index({ scopeEntityId: 1 });
SchedulingRuleSchema.index({ category: 1 });
SchedulingRuleSchema.index({ isActive: 1 });
SchedulingRuleSchema.index({
  organizationId: 1,
  ruleType: 1,
  scope: 1,
  isActive: 1,
});

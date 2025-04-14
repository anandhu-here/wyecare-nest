import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ShiftDocument = Shift & Document;

@Schema({ _id: false })
class NursePreference {
  @Prop({ type: String, enum: ['RN', 'EN', 'NA'], default: 'NA' })
  classification!: string;

  @Prop({ type: Number, default: 1, min: 0 })
  count!: number;
}

@Schema({ _id: false })
class GenderPreference {
  @Prop({ type: Number, default: 0 })
  male!: number;

  @Prop({ type: Number, default: 0 })
  female!: number;
}

@Schema({ _id: false })
class Requirements {
  @Prop({ type: Number, default: 0 })
  minExperience!: number;

  @Prop({ type: [String] })
  specializations?: string[];

  @Prop({ type: [String] })
  certifications?: string[];
}

@Schema({ _id: false })
class MatchDetails {
  @Prop({ type: Boolean })
  experienceMatch?: boolean;

  @Prop({ type: [String] })
  specializationMatches?: string[];

  @Prop({ type: [String] })
  certificationMatches?: string[];

  @Prop({ type: Boolean })
  genderMatch?: boolean;

  @Prop({ type: Boolean })
  isPreferred?: boolean;
}

@Schema({ _id: false })
class MatchedStaff {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  user!: MongooseSchema.Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  matchScore!: number;

  @Prop({ type: MatchDetails })
  matchDetails?: MatchDetails;
}

@Schema({ timestamps: true })
export class Shift {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: false,
  })
  agentId?: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  })
  homeId!: MongooseSchema.Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  isAccepted!: boolean;

  @Prop({ type: Boolean, default: false })
  isRejected!: boolean;

  @Prop({ type: Boolean, default: false })
  isCompleted!: boolean;

  @Prop({ type: Boolean, default: false })
  isDone!: boolean;

  @Prop({ type: Boolean, default: false })
  isTemporaryHome!: boolean;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'TemporaryHome',
    required: false,
  })
  temporaryHomeId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  count!: number;

  @Prop({ type: String, required: true })
  date!: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }] })
  assignedUsers?: MongooseSchema.Types.ObjectId[];

  @Prop({ type: String, required: false })
  privateKey?: string;

  @Prop({ type: Object, default: {} })
  signedCarers!: Record<string, any>;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ShiftPattern' })
  shiftPattern?: MongooseSchema.Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  agencyAccepted!: boolean;

  @Prop({ type: String, required: false })
  qrCodeToken?: string;

  @Prop({ type: Date, required: false })
  qrCodeTokenExpiry?: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  qrCodeTokenUserId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: GenderPreference, default: () => ({}) })
  genderPreference!: GenderPreference;

  @Prop({ type: NursePreference, default: () => ({}) })
  nursePreference!: NursePreference;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }] })
  preferredStaff?: MongooseSchema.Types.ObjectId[];

  @Prop({ type: Boolean, default: false })
  needsApproval!: boolean;

  @Prop({
    type: String,
    enum: ['pending', 'approved', 'rejected', 'invalidated'],
    default: 'pending',
  })
  bookingStatus!: string;

  @Prop({ type: Requirements, default: () => ({}) })
  requirements!: Requirements;

  @Prop({ type: Boolean, default: false })
  emergency!: boolean;

  @Prop({ type: Boolean, default: false })
  isEmergency!: boolean;

  @Prop({ type: [MatchedStaff], default: [] })
  matchedStaff!: MatchedStaff[];
}

export const ShiftSchema = SchemaFactory.createForClass(Shift);

// Add indexes
ShiftSchema.index({ homeId: 1, date: 1 });
ShiftSchema.index({ agentId: 1 });
ShiftSchema.index({ assignedUsers: 1 });
ShiftSchema.index({ date: 1 });
ShiftSchema.index({ qrCodeToken: 1 });
ShiftSchema.index({ qrCodeTokenUserId: 1 });
ShiftSchema.index({ shiftPattern: 1 });
ShiftSchema.index({ isAccepted: 1, isRejected: 1 });
ShiftSchema.index({ isCompleted: 1 });
ShiftSchema.index({ createdAt: -1 });

// Compound indexes
ShiftSchema.index({ homeId: 1, date: 1, isCompleted: 1 });
ShiftSchema.index({ agentId: 1, date: 1, isAccepted: 1 });
ShiftSchema.index({ assignedUsers: 1, date: 1, isCompleted: 1 });

ShiftSchema.index({ 'genderPreference.male': 1, 'genderPreference.female': 1 });
ShiftSchema.index({ preferredStaff: 1 });
ShiftSchema.index({ 'requirements.specializations': 1 });
ShiftSchema.index({ 'requirements.certifications': 1 });
ShiftSchema.index({ 'matchedStaff.matchScore': -1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import * as luxon from 'luxon';

export type AttendanceDocument = Attendance & Document;

// Enums for better type safety
export enum AttendanceStatus {
  PENDING = 'pending',
  SIGNED_IN = 'signedIn',
  SIGNED_OUT = 'signedOut',
  ABSENT = 'absent',
  LATE = 'late',
}

export enum ModificationType {
  MANUAL_CLOCK_IN = 'MANUAL_CLOCK_IN',
  MANUAL_CLOCK_OUT = 'MANUAL_CLOCK_OUT',
  ADMIN_MODIFICATION = 'ADMIN_MODIFICATION',
  SYSTEM_MODIFICATION = 'SYSTEM_MODIFICATION',
}

export enum ModifierType {
  AGENCY_ADMIN = 'AGENCY_ADMIN',
  HOME_ADMIN = 'HOME_ADMIN',
  SYSTEM = 'SYSTEM',
}

// Nested schemas
@Schema({ _id: false })
export class Location {
  @Prop({ type: [Number], index: '2dsphere' })
  coordinates: [number, number] = [0, 0];

  @Prop()
  accuracy!: number;

  @Prop()
  timestamp!: Date;

  @Prop()
  deviceId?: string;

  @Prop()
  address?: string;
}

@Schema({ _id: false })
export class DeviceInfo {
  @Prop()
  type!: string;

  @Prop()
  browser!: string;

  @Prop()
  os!: string;

  @Prop()
  ip!: string;
}

@Schema({ _id: false })
export class QRValidation {
  @Prop()
  scannedAt!: Date;

  @Prop()
  validUntil!: Date;

  @Prop({ default: 0 })
  attempts!: number;

  @Prop()
  lastAttempt!: Date;

  @Prop({ type: Location })
  location?: Location;

  @Prop({ type: DeviceInfo })
  deviceInfo?: DeviceInfo;
}

@Schema({ _id: false })
export class Change {
  @Prop()
  field!: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  oldValue: any;

  @Prop({ type: MongooseSchema.Types.Mixed })
  newValue: any;
}

@Schema({ _id: false })
export class Modification {
  @Prop({ required: true })
  timestamp!: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  modifiedBy!: Types.ObjectId;

  @Prop({ enum: Object.values(ModifierType), required: true })
  modifiedByType: ModifierType = ModifierType.AGENCY_ADMIN;

  @Prop({ required: true })
  reason!: string;

  @Prop({ type: [Change] })
  changes: Change[] = [];
}

// Main Attendance Schema
@Schema({
  timestamps: true,
  optimisticConcurrency: true,
})
export class Attendance {
  // Core fields
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Shift',
    required: true,
    index: true,
  })
  shift!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'ShiftPattern',
    required: true,
  })
  shiftPattern!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  workplace!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
  })
  organization?: Types.ObjectId;

  @Prop({
    required: true,
    index: true,
  })
  date!: Date;

  // Status and times
  @Prop({
    enum: Object.values(AttendanceStatus),
    default: AttendanceStatus.PENDING,
    required: true,
    index: true,
  })
  status: AttendanceStatus = AttendanceStatus.PENDING;

  @Prop({ default: null })
  signInTime!: Date | null;

  @Prop({ default: null })
  signOutTime!: Date | null;

  @Prop({ required: true })
  expectedStartTime!: Date;

  @Prop({ required: true })
  expectedEndTime!: Date;

  // QR Code and validation
  @Prop({
    required: true,
    unique: true,
  })
  qrCode!: string;

  @Prop({ required: true })
  qrCodeExpiry!: Date;

  @Prop({ type: QRValidation })
  clockInQRValidation?: QRValidation;

  @Prop({ type: QRValidation })
  clockOutQRValidation?: QRValidation;

  // Location tracking
  @Prop({ type: Location })
  clockInLocation?: Location;

  @Prop({ type: Location })
  clockOutLocation?: Location;

  // Duration and lateness
  @Prop({ default: null })
  duration?: number;

  @Prop({ required: true })
  expectedDuration!: number;

  @Prop({ default: null })
  lateBy?: number;

  @Prop({ default: null })
  earlyDepartureBy?: number;

  @Prop({ default: 0 })
  breakDuration?: number;

  // Modification tracking
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  modifiedBy?: Types.ObjectId;

  @Prop()
  modifiedAt?: Date;

  @Prop()
  modifiedReason?: string;

  @Prop({ enum: Object.values(ModificationType) })
  modifiedType?: ModificationType;

  @Prop({ enum: Object.values(ModifierType) })
  modifiedByType?: ModifierType;

  @Prop({ type: [Modification] })
  modifications: Modification[] = [];

  @Prop({
    default: true,
    index: true,
  })
  isActive: boolean = false;

  createdAt!: Date;
  updatedAt!: Date;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);

// Add complex indexes
AttendanceSchema.index({ user: 1, date: 1 });
AttendanceSchema.index({ workplace: 1, date: 1 });
AttendanceSchema.index({ qrCode: 1 }, { unique: true });
AttendanceSchema.index(
  { user: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: AttendanceStatus.SIGNED_IN,
      isActive: true,
    },
  }
);
AttendanceSchema.index({ user: 1, shift: 1, date: 1 }, { unique: true });

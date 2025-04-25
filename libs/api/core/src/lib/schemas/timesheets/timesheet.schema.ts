// api/features/src/lib/timesheets/schemas/timesheet.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type TimesheetDocument = Timesheet & Document;

export enum TimesheetStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  INVALIDATED = 'invalidated',
}

export enum InvoiceStatus {
  PENDING_INVOICE = 'pending_invoice',
  INVOICED = 'invoiced',
  PAID = 'paid',
  APPROVED = 'approved',
  INVALIDATED = 'invalidated',
  IDLE = 'idle',
}

export enum RequestType {
  MANUAL = 'manual',
  AUTO = 'auto',
}

export enum SignerRole {
  NURSE = 'nurse',
  SENIOR_CARER = 'senior carer',
  MANAGER = 'manager',
}

@Schema({ _id: false })
export class Signature {
  @Prop()
  storageRef?: string;

  @Prop()
  downloadUrl?: string;

  @Prop()
  timestamp?: Date;

  @Prop()
  ipAddress?: string;

  @Prop()
  deviceInfo?: string;

  @Prop({ default: false })
  verified: boolean = false;

  @Prop()
  signerName?: string;

  @Prop({ type: String, enum: SignerRole })
  signerRole?: SignerRole;
}

@Schema({ timestamps: true })
export class Timesheet {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Shift',
    required: true,
  })
  shiftId!: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  carer!: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  })
  home!: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: false,
  })
  agency?: MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
    enum: TimesheetStatus,
    default: TimesheetStatus.PENDING,
  })
  status: any = 'pending';

  @Prop({
    type: String,
    enum: InvoiceStatus,
    default: null,
  })
  invoiceStatus?: InvoiceStatus;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Invoice',
    default: null,
  })
  invoiceId?: MongooseSchema.Types.ObjectId;

  @Prop({ default: null })
  invoicedAt?: Date;

  @Prop({ default: null })
  invoiceNumber?: string;

  @Prop({ default: null })
  paidAt?: Date;

  @Prop({ default: null })
  paymentReference?: string;

  @Prop({
    type: Number,
    min: 1,
    max: 5,
    default: null,
  })
  rating?: number;

  @Prop({ default: null })
  review?: string;

  @Prop({
    type: String,
    enum: RequestType,
    default: RequestType.AUTO,
  })
  requestType?: RequestType;

  @Prop()
  documentUrl?: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
  })
  approvedBy?: MongooseSchema.Types.ObjectId;

  @Prop()
  tokenForQrCode?: string;

  @Prop({ type: Signature })
  signature?: Signature;
}

export const TimesheetSchema = SchemaFactory.createForClass(Timesheet);

// Add indexes
TimesheetSchema.index({ home: 1, invoiceStatus: 1 });
TimesheetSchema.index({ agency: 1, invoiceStatus: 1 });
TimesheetSchema.index({ carer: 1, status: 1 });
TimesheetSchema.index({ shiftId: 1 }); // Renamed from shift_
TimesheetSchema.index({ invoiceId: 1 });
TimesheetSchema.index({ status: 1 });
TimesheetSchema.index({ createdAt: -1 });
TimesheetSchema.index({ invoiceStatus: 1, invoicedAt: 1 });
TimesheetSchema.index({ tokenForQrCode: 1 });

// Compound indexes
TimesheetSchema.index({ home: 1, carer: 1, status: 1 });
TimesheetSchema.index({ agency: 1, home: 1, invoiceStatus: 1 });
TimesheetSchema.index({ shiftId: 1, status: 1, invoiceStatus: 1 }); // Renamed from shift_

// Add virtual for shift
TimesheetSchema.virtual('shift', {
  ref: 'Shift',
  localField: 'shiftId', // Changed from shift_
  foreignField: '_id',
  justOne: true,
});

// Add pre-save hook
TimesheetSchema.pre('save', function (next) {
  const doc = this as any;
  if (doc.isModified('invoiceStatus')) {
    switch (doc.invoiceStatus) {
      case InvoiceStatus.INVOICED:
        doc.invoicedAt = new Date();
        break;
      case InvoiceStatus.PAID:
        doc.paidAt = new Date();
        break;
      case InvoiceStatus.PENDING_INVOICE:
      default:
        break;
    }
  }
  next();
});

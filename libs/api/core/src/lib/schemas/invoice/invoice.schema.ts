import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type InvoiceDocument = Invoice & Document;

@Schema({ _id: false })
class ShiftSummaryItem {
  @Prop({ type: Number })
  count!: number;

  @Prop({ type: Number })
  weekdayHours!: number;

  @Prop({ type: Number })
  weekendHours!: number;

  @Prop({ type: Number })
  holidayHours!: number;

  @Prop({ type: Number })
  emergencyHours!: number;

  @Prop({ type: Number })
  weekdayRate!: number;

  @Prop({ type: Number })
  weekendRate!: number;

  @Prop({ type: Number })
  holidayRate!: number;

  @Prop({ type: Number })
  emergencyRate!: number;

  @Prop({ type: Number })
  totalHours!: number;

  @Prop({ type: Number })
  totalAmount!: number;
}

@Schema({ _id: false })
class HomeDetails {
  @Prop({ type: String })
  name?: string;

  @Prop({ type: String })
  email?: string;

  @Prop({ type: String })
  phone?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  address?: Record<string, any>;
}

@Schema({ timestamps: true, collection: 'invoices' })
export class Invoice {
  @Prop({ type: String, required: false, unique: true })
  invoiceNumber?: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  })
  homeId!: MongooseSchema.Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  isTemporaryHome!: boolean;

  @Prop({ type: String, required: false })
  temporaryHomeId?: string;

  @Prop({ type: HomeDetails })
  homeDetails?: HomeDetails;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  })
  agencyId!: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date, required: true })
  startDate!: Date;

  @Prop({ type: Date, required: true })
  endDate!: Date;

  @Prop({ type: Number, required: true })
  totalAmount!: number;

  // Instead of using Map<string, ShiftSummaryItem>, use MongooseSchema.Types.Mixed for Map
  @Prop({ type: MongooseSchema.Types.Mixed })
  shiftSummary!: Record<string, any>;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;

  @Prop({ type: Date, required: false })
  dueDate?: Date;

  @Prop({ type: [String], required: false })
  timesheetIds?: string[];

  @Prop({
    type: String,
    enum: [
      'draft',
      'pending',
      'sent',
      'paid',
      'cancelled',
      'partially_paid',
      'accepted',
      'rejected',
      'invalidated',
    ],
    default: 'draft',
  })
  status!: string;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

// Add indexes
InvoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ homeId: 1, status: 1 });
InvoiceSchema.index({ agencyId: 1, status: 1 });
InvoiceSchema.index({ dueDate: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ startDate: -1 });
InvoiceSchema.index({ endDate: -1 });
InvoiceSchema.index({ createdAt: -1 });
InvoiceSchema.index({ homeId: 1, agencyId: 1, startDate: -1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Rate, RateSchema } from './rate.schema';
import { UserTypeRate, UserTypeRateSchema } from './user-type-rate.schema';
import { HomeTiming, HomeTimingSchema } from './home-timing.schema';

export type ShiftPatternDocument = ShiftPattern & Document;

@Schema({ timestamps: true })
export class ShiftPattern {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    ref: 'Organization',
  })
  userId!: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({ type: [RateSchema] })
  rates?: Rate[];

  @Prop({ type: [UserTypeRateSchema] })
  userTypeRates?: UserTypeRate[];

  @Prop({ type: [HomeTimingSchema] })
  timings?: HomeTiming[];
}

export const ShiftPatternSchema = SchemaFactory.createForClass(ShiftPattern);

// Add indexes for better query performance
ShiftPatternSchema.index({ userId: 1 });
ShiftPatternSchema.index({ name: 1 });
ShiftPatternSchema.index({ 'rates.careHomeId': 1 });
ShiftPatternSchema.index({ 'userTypeRates.userType': 1 });

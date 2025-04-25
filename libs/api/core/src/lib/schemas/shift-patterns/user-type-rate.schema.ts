import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserTypeRateDocument = UserTypeRate & Document;

@Schema({ _id: false })
export class UserTypeRate {
  @Prop({ required: true })
  userType!: string;

  @Prop({ required: true })
  weekdayRate!: number;

  @Prop({ required: true })
  weekendRate!: number;

  @Prop()
  holidayRate?: number;

  @Prop({ required: true })
  emergencyWeekdayRate!: number;

  @Prop({ required: true })
  emergencyWeekendRate!: number;

  @Prop()
  emergencyHolidayRate?: number;
}

export const UserTypeRateSchema = SchemaFactory.createForClass(UserTypeRate);

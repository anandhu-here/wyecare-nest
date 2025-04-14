import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import moment from 'moment';

export type HomeTimingDocument = HomeTiming & Document;

@Schema({ _id: false })
export class HomeTiming {
  @Prop({ required: true })
  startTime!: string;

  @Prop({ required: true })
  endTime!: string;

  @Prop({ required: true })
  careHomeId!: string;

  @Prop()
  billableHours?: number;

  @Prop()
  breakHours?: number;
}

export const HomeTimingSchema = SchemaFactory.createForClass(HomeTiming);

// Add custom validators
HomeTimingSchema.path('billableHours').validate(function (value: number) {
  if (value === undefined || value === null) return true;

  const start = moment(this.startTime, 'HH:mm');
  const end = moment(this.endTime, 'HH:mm');
  let duration;

  if (end.isBefore(start)) {
    // Handle overnight shifts
    duration = moment.duration(end.add(1, 'day').diff(start)).asHours();
  } else {
    duration = moment.duration(end.diff(start)).asHours();
  }

  return value <= duration;
}, 'Billable hours cannot exceed shift duration');

HomeTimingSchema.path('breakHours').validate(function (value: number) {
  if (value === undefined || value === null) return true;

  const start = moment(this.startTime, 'HH:mm');
  const end = moment(this.endTime, 'HH:mm');
  let duration;

  if (end.isBefore(start)) {
    // Handle overnight shifts
    duration = moment.duration(end.add(1, 'day').diff(start)).asHours();
  } else {
    duration = moment.duration(end.diff(start)).asHours();
  }

  return value <= duration;
}, 'Break hours cannot exceed shift duration');

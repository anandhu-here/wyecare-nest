// libs/api/features/src/lib/shifts/dto/clock-event.dto.ts
import {
  IsMongoId,
  IsNotEmpty,
  IsEnum,
  IsDate,
  IsOptional,
  IsString,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ClockEventType } from 'libs/api/core/src/lib/schemas';

export class RecordClockEventDto {
  @IsMongoId()
  @IsNotEmpty()
  shiftAssignmentId!: string;

  @IsEnum(ClockEventType)
  type!: string;

  @IsDate()
  @Type(() => Date)
  timestamp!: Date;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsMongoId()
  verifiedBy?: string;
}

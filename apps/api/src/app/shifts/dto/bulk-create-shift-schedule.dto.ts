// apps/api/src/app/shifts/dto/bulk-create-shift-schedule.dto.ts
import {
  IsNotEmpty,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateShiftScheduleDto } from './create-shift-schedule.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkCreateShiftScheduleDto {
  @ApiProperty({
    type: [CreateShiftScheduleDto],
    description: 'Array of shift schedules to be created',
  })
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateShiftScheduleDto)
  shifts: CreateShiftScheduleDto[];
}

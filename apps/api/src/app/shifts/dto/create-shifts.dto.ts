import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean, IsDate, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateShiftsDto {
  // Define properties here based on your Prisma model
  // Example properties (customize based on your model)
  @IsNotEmpty()
  @IsString()
  name: string;
  
  @IsOptional()
  @IsString()
  description?: string;
  
  @IsNotEmpty()
  @IsUUID()
  organizationId: string;
}

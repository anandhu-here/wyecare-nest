import { IsString, IsNotEmpty } from 'class-validator';

export class InvalidateLeaveRequestDto {
  @IsNotEmpty()
  @IsString()
  reason: string;
}

import { IsString, IsNotEmpty } from 'class-validator';

export class CancelLeaveRequestDto {
  @IsNotEmpty()
  @IsString()
  reason: string;
}

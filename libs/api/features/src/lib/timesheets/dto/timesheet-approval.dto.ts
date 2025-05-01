import {
  IsMongoId,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export enum TimesheetAction {
  SUBMIT = 'submit',
  APPROVE = 'approve',
  REJECT = 'reject',
  REOPEN = 'reopen',
  MARK_PAID = 'mark_paid',
}

export class TimesheetApprovalDto {
  @IsMongoId()
  @IsNotEmpty()
  timesheetId!: string;

  @IsEnum(TimesheetAction)
  action!: string;

  @IsOptional()
  @IsString()
  comments?: string;
}

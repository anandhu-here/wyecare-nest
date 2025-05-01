// libs/api/features/src/lib/shifts/dto/create-scheduling-rule.dto.ts
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsObject,
  ValidateNested,
  IsEnum,
  IsArray,
  IsMongoId,
  IsDate,
} from 'class-validator';
import {
  OrganizationCategory,
  RuleScope,
  RuleSeverity,
  RuleType,
} from 'libs/api/core/src/lib/schemas';

export class RuleConditionDto {
  @IsString()
  @IsNotEmpty()
  field!: string;

  @IsString()
  @IsNotEmpty()
  operator!: string;

  @IsNotEmpty()
  value: any;

  @IsOptional()
  @IsString()
  logicalOperator?: 'AND' | 'OR';
}

export class CreateSchedulingRuleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsMongoId()
  organizationId?: string; // Optional as it may be retrieved from request context

  @IsEnum(RuleType)
  ruleType!: string;

  @IsEnum(RuleSeverity)
  severity!: string;

  @IsEnum(RuleScope)
  scope!: string;

  @IsOptional()
  @IsMongoId()
  scopeEntityId?: string;

  @IsOptional()
  @IsEnum(OrganizationCategory)
  category?: string;

  @IsObject()
  parameters!: Record<string, any>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleConditionDto)
  conditions?: RuleConditionDto[];

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  effectiveFrom?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  effectiveTo?: Date;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

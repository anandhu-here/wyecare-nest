// compensation-rate.dto.ts

export class CreateCompensationRateDto {
  staffProfileId: string;
  departmentId: string;
  baseRate: number;
  specialtyBonus?: number;
  experienceMultiplier?: number;
  effectiveDate?: Date;
  endDate?: Date;
}

export class UpdateCompensationRateDto {
  baseRate?: number;
  specialtyBonus?: number;
  experienceMultiplier?: number;
  effectiveDate?: Date;
  endDate?: Date;
}

export class FindCompensationRateDto {
  staffProfileId?: string;
  departmentId?: string;
  effectiveDate?: Date;
  active?: boolean; // To get only active rates (no endDate or endDate > now)
  skip?: number;
  take?: number;
}

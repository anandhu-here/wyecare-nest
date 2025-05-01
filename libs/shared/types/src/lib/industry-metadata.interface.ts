// libs/api/features/src/lib/shifts/interfaces/industry-metadata.interface.ts

/**
 * Healthcare specific metadata for shift assignments
 */
export interface HealthcareShiftMetadata {
  /** Patient assignments for this shift */
  patientAssignments?: {
    patientId: string;
    roomNumber?: string;
    careLevel?: string;
  }[];

  /** Required qualifications for this shift */
  requiredQualifications?: {
    qualificationId: string;
    name: string;
    verified: boolean;
  }[];

  /** Number of patients under care */
  patientCount?: number;

  /** Medication administration responsibilities */
  medicationAdmin?: boolean;

  /** Special care requirements */
  specialCare?: string[];

  /** Handover notes */
  handoverNotes?: string;
}

/**
 * Retail specific metadata for shift assignments
 */
export interface RetailShiftMetadata {
  /** Sales targets for this shift */
  salesTarget?: number;

  /** Actual sales achieved during shift */
  actualSales?: number;

  /** Number of transactions processed */
  transactionCount?: number;

  /** Average transaction value */
  averageTransactionValue?: number;

  /** Areas of responsibility (e.g., checkout, floor, fitting room) */
  areas?: string[];

  /** Products or promotions focused on during shift */
  promotionFocus?: string[];

  /** Customer count */
  customerCount?: number;
}

/**
 * Manufacturing specific metadata for shift assignments
 */
export interface ManufacturingShiftMetadata {
  /** Production line assignment */
  productionLine?: string;

  /** Product being manufactured */
  product?: string;

  /** Production targets for this shift */
  productionTarget?: number;

  /** Actual production achieved */
  actualProduction?: number;

  /** Quality metrics */
  qualityMetrics?: {
    defectRate?: number;
    inspectionCount?: number;
    rejectionCount?: number;
  };

  /** Equipment used during shift */
  equipment?: string[];

  /** Downtime minutes and reasons */
  downtime?: {
    minutes: number;
    reason: string;
  }[];
}

/**
 * Hospitality specific metadata for shift assignments
 */
export interface HospitalityShiftMetadata {
  /** Service areas assigned */
  serviceAreas?: string[];

  /** Number of covers/tables served */
  coverCount?: number;

  /** Tips/gratuity earned */
  tips?: number;

  /** Special events during shift */
  events?: {
    name: string;
    guestCount?: number;
  }[];

  /** Menu specials during shift */
  menuSpecials?: string[];

  /** Customer satisfaction metrics */
  customerSatisfaction?: {
    rating?: number;
    feedbackCount?: number;
  };
}

/**
 * Education specific metadata for shift assignments
 */
export interface EducationShiftMetadata {
  /** Classes/courses taught */
  classes?: {
    classId: string;
    name: string;
    studentCount?: number;
    duration?: number;
  }[];

  /** Subjects covered */
  subjects?: string[];

  /** Grade level */
  gradeLevel?: string;

  /** Administrative duties */
  adminDuties?: string[];

  /** Meetings attended */
  meetings?: {
    type: string;
    duration: number;
  }[];

  /** Special activities (field trips, events) */
  specialActivities?: string[];
}

/**
 * Professional Services specific metadata for shift assignments
 */
export interface ProfessionalServicesShiftMetadata {
  /** Client assignments */
  clients?: {
    clientId: string;
    name: string;
    projectId?: string;
  }[];

  /** Billable hours */
  billableHours?: number;

  /** Non-billable hours */
  nonBillableHours?: number;

  /** Tasks completed */
  tasksCompleted?: {
    taskId: string;
    description: string;
    timeSpent: number;
  }[];

  /** Deliverables completed */
  deliverablesCompleted?: string[];

  /** Billable rate for this shift */
  billableRate?: number;
}

/**
 * Transportation/Logistics specific metadata for shift assignments
 */
export interface LogisticsShiftMetadata {
  /** Routes covered */
  routes?: {
    routeId: string;
    startLocation: string;
    endLocation: string;
    distance?: number;
  }[];

  /** Vehicle information */
  vehicle?: {
    vehicleId: string;
    type: string;
    registrationNumber?: string;
  };

  /** Delivery metrics */
  deliveries?: {
    count: number;
    onTimePercentage?: number;
  };

  /** Mileage tracked */
  mileage?: number;

  /** Fuel consumption */
  fuelConsumption?: number;

  /** Rest periods taken */
  restPeriods?: {
    startTime: string;
    endTime: string;
    location?: string;
  }[];
}

/**
 * Construction specific metadata for shift assignments
 */
export interface ConstructionShiftMetadata {
  /** Project assignment */
  project?: {
    projectId: string;
    name: string;
    location?: string;
  };

  /** Site location */
  siteLocation?: string;

  /** Tasks completed */
  tasksCompleted?: {
    description: string;
    completionPercentage?: number;
  }[];

  /** Equipment operated */
  equipmentOperated?: string[];

  /** Materials used */
  materialsUsed?: {
    materialId: string;
    name: string;
    quantity: number;
    unit: string;
  }[];

  /** Safety incidents */
  safetyIncidents?: {
    description: string;
    severity: 'low' | 'medium' | 'high';
    reportFiled: boolean;
  }[];
}

/**
 * Union type for all industry-specific metadata
 */
export type ShiftMetadata =
  | HealthcareShiftMetadata
  | RetailShiftMetadata
  | ManufacturingShiftMetadata
  | HospitalityShiftMetadata
  | EducationShiftMetadata
  | ProfessionalServicesShiftMetadata
  | LogisticsShiftMetadata
  | ConstructionShiftMetadata
  | Record<string, any>; // Allow for custom fields

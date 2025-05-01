// libs/api/features/src/lib/shifts/services/system-templates.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ShiftTemplate,
  ShiftTemplateDocument,
} from 'libs/api/core/src/lib/schemas';
import {
  SchedulingRule,
  SchedulingRuleDocument,
  RuleType,
  RuleSeverity,
  RuleScope,
} from 'libs/api/core/src/lib/schemas';
import {
  ShiftRotationPattern,
  ShiftRotationPatternDocument,
} from 'libs/api/core/src/lib/schemas';
import { OrganizationCategory } from 'libs/api/core/src/lib/schemas';

@Injectable()
export class SystemTemplatesService implements OnModuleInit {
  private readonly logger = new Logger(SystemTemplatesService.name);

  constructor(
    @InjectModel(ShiftTemplate.name)
    private shiftTemplateModel: Model<ShiftTemplateDocument>,

    @InjectModel(SchedulingRule.name)
    private schedulingRuleModel: Model<SchedulingRuleDocument>,

    @InjectModel(ShiftRotationPattern.name)
    private shiftRotationPatternModel: Model<ShiftRotationPatternDocument>
  ) {}

  /**
   * Initialize system templates when module starts
   */
  async onModuleInit() {
    try {
      await this.ensureSystemTemplatesExist();
      this.logger.log('System shift templates initialized');

      await this.ensureSystemRulesExist();
      this.logger.log('System scheduling rules initialized');

      // Rotation patterns need shift type IDs, so they should be created
      // by organizations when they set up their specific shift types
    } catch (error) {
      this.logger.error('Failed to initialize system templates', error);
    }
  }

  /**
   * Creates industry-specific shift templates if they don't already exist
   */
  async ensureSystemTemplatesExist(): Promise<void> {
    const systemTemplates = this.getDefaultShiftTemplates();

    for (const template of systemTemplates) {
      // Check if template already exists
      const existingTemplate = await this.shiftTemplateModel.findOne({
        name: template.name,
        category: template.category,
        isSystem: true,
      });

      if (!existingTemplate) {
        await this.shiftTemplateModel.create({
          ...template,
          isSystem: true,
        });
      }
    }
  }

  /**
   * Creates industry-specific scheduling rules if they don't already exist
   */
  async ensureSystemRulesExist(): Promise<void> {
    // System rules will be templates without an organizationId
    // Organizations will clone them with their specific organizationId
    const systemRules = this.getDefaultSchedulingRules();

    for (const rule of systemRules) {
      // Check if rule already exists
      const existingRule = await this.schedulingRuleModel.findOne({
        name: rule.name,
        category: rule.category,
        isSystem: true,
      });

      if (!existingRule) {
        // Create without organizationId - this is a template
        const ruleToCreate = { ...rule };
        delete ruleToCreate.organizationId;

        await this.schedulingRuleModel.create({
          ...ruleToCreate,
          isSystem: true,
        });
      }
    }
  }

  /**
   * Get default shift templates for all supported industries
   */
  private getDefaultShiftTemplates(): Partial<ShiftTemplate>[] {
    return [
      // Healthcare industry templates
      {
        name: 'Day Shift',
        description: 'Standard day shift for healthcare staff',
        category: OrganizationCategory.HEALTHCARE,
        defaultTiming: {
          startTime: '07:00',
          endTime: '19:00',
          durationMinutes: 720,
          isOvernight: false,
        },
        applicableDays: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        color: '#4CAF50', // Green
        icon: 'sun',
        defaultPaymentMethod: 'hourly',
        qualificationRequirements: [],
        metadata: {
          staffingRequirements: {
            minimumStaff: 2,
            preferredStaff: 3,
          },
        },
      },
      {
        name: 'Night Shift',
        description: 'Overnight shift for healthcare staff',
        category: OrganizationCategory.HEALTHCARE,
        defaultTiming: {
          startTime: '19:00',
          endTime: '07:00',
          durationMinutes: 720,
          isOvernight: true,
        },
        applicableDays: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        color: '#3F51B5', // Indigo
        icon: 'moon',
        defaultPaymentMethod: 'hourly',
        defaultPaymentConfig: {
          nightDifferential: 0.15, // 15% night differential
        },
        qualificationRequirements: [],
        metadata: {
          staffingRequirements: {
            minimumStaff: 2,
            preferredStaff: 3,
          },
        },
      },

      // Hospital specific templates
      {
        name: 'Morning Rounds',
        description: 'Morning rounds for hospital doctors',
        category: OrganizationCategory.HOSPITAL,
        defaultTiming: {
          startTime: '06:00',
          endTime: '09:00',
          durationMinutes: 180,
          isOvernight: false,
        },
        applicableDays: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
        ],
        color: '#FF9800', // Orange
        icon: 'clipboard',
        defaultPaymentMethod: 'hourly',
        qualificationRequirements: [
          {
            name: 'Medical License',
            isRequired: true,
          },
        ],
      },

      // Retail industry templates
      {
        name: 'Morning Shift',
        description: 'Morning retail shift',
        category: OrganizationCategory.RETAIL,
        defaultTiming: {
          startTime: '08:00',
          endTime: '16:00',
          durationMinutes: 480,
          isOvernight: false,
        },
        applicableDays: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        color: '#2196F3', // Blue
        icon: 'shopping-cart',
        defaultPaymentMethod: 'hourly',
      },
      {
        name: 'Evening Shift',
        description: 'Evening retail shift',
        category: OrganizationCategory.RETAIL,
        defaultTiming: {
          startTime: '16:00',
          endTime: '00:00',
          durationMinutes: 480,
          isOvernight: false,
        },
        applicableDays: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        color: '#9C27B0', // Purple
        icon: 'moon',
        defaultPaymentMethod: 'hourly',
        defaultPaymentConfig: {
          nightDifferential: 0.1, // 10% night differential
        },
      },

      // Manufacturing industry templates
      {
        name: 'First Shift',
        description: 'First manufacturing shift',
        category: OrganizationCategory.MANUFACTURING,
        defaultTiming: {
          startTime: '06:00',
          endTime: '14:00',
          durationMinutes: 480,
          isOvernight: false,
        },
        applicableDays: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
        ],
        color: '#FFC107', // Amber
        icon: 'tool',
        defaultPaymentMethod: 'hourly',
      },
      {
        name: 'Second Shift',
        description: 'Second manufacturing shift',
        category: OrganizationCategory.MANUFACTURING,
        defaultTiming: {
          startTime: '14:00',
          endTime: '22:00',
          durationMinutes: 480,
          isOvernight: false,
        },
        applicableDays: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
        ],
        color: '#FF5722', // Deep Orange
        icon: 'tool',
        defaultPaymentMethod: 'hourly',
        defaultPaymentConfig: {
          shiftDifferential: 0.05, // 5% shift differential
        },
      },
      {
        name: 'Third Shift',
        description: 'Third manufacturing shift (night)',
        category: OrganizationCategory.MANUFACTURING,
        defaultTiming: {
          startTime: '22:00',
          endTime: '06:00',
          durationMinutes: 480,
          isOvernight: true,
        },
        applicableDays: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
        ],
        color: '#607D8B', // Blue Grey
        icon: 'tool',
        defaultPaymentMethod: 'hourly',
        defaultPaymentConfig: {
          nightDifferential: 0.15, // 15% night differential
        },
      },

      // Hospitality industry templates
      {
        name: 'Morning Service',
        description: 'Morning hospitality service shift',
        category: OrganizationCategory.HOSPITALITY,
        defaultTiming: {
          startTime: '06:00',
          endTime: '14:00',
          durationMinutes: 480,
          isOvernight: false,
        },
        applicableDays: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        color: '#8BC34A', // Light Green
        icon: 'coffee',
        defaultPaymentMethod: 'hourly',
      },
      {
        name: 'Evening Service',
        description: 'Evening hospitality service shift',
        category: OrganizationCategory.HOSPITALITY,
        defaultTiming: {
          startTime: '14:00',
          endTime: '22:00',
          durationMinutes: 480,
          isOvernight: false,
        },
        applicableDays: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        color: '#E91E63', // Pink
        icon: 'utensils',
        defaultPaymentMethod: 'hourly',
        defaultPaymentConfig: {
          serviceFee: true, // Enable service charge/tips
        },
      },

      // Education industry templates
      {
        name: 'School Hours',
        description: 'Standard school hours shift',
        category: OrganizationCategory.EDUCATION,
        defaultTiming: {
          startTime: '08:00',
          endTime: '16:00',
          durationMinutes: 480,
          isOvernight: false,
        },
        applicableDays: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
        ],
        color: '#00BCD4', // Cyan
        icon: 'book',
        defaultPaymentMethod: 'monthly',
        defaultPaymentConfig: {
          baseAmount: 3000, // Example monthly salary
          workingDaysPerPeriod: 22,
        },
      },
      {
        name: 'After School Program',
        description: 'After school program shift',
        category: OrganizationCategory.EDUCATION,
        defaultTiming: {
          startTime: '16:00',
          endTime: '18:00',
          durationMinutes: 120,
          isOvernight: false,
        },
        applicableDays: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
        ],
        color: '#009688', // Teal
        icon: 'users',
        defaultPaymentMethod: 'hourly',
      },
    ];
  }

  /**
   * Get default scheduling rules for all supported industries
   */
  private getDefaultSchedulingRules(): Partial<SchedulingRule>[] {
    return [
      // Healthcare rules
      {
        name: 'Minimum Rest Between Shifts',
        description:
          'Healthcare staff must have at least 11 hours rest between shifts',
        ruleType: RuleType.REST_PERIOD,
        severity: RuleSeverity.ERROR,
        scope: RuleScope.ORGANIZATION,
        category: OrganizationCategory.HEALTHCARE,
        parameters: {
          minimumRestHours: 11,
          checkPeriodDays: 1,
        },
        errorMessage:
          'Healthcare staff must have at least 11 hours rest between shifts',
      },
      {
        name: 'Maximum Weekly Hours',
        description:
          'Healthcare staff should not work more than 48 hours per week',
        ruleType: RuleType.MAX_HOURS_PERIOD,
        severity: RuleSeverity.WARNING,
        scope: RuleScope.ORGANIZATION,
        category: OrganizationCategory.HEALTHCARE,
        parameters: {
          maxHours: 48,
          periodDays: 7,
        },
        errorMessage:
          'Staff member is scheduled for more than 48 hours in a week',
      },

      // Manufacturing rules
      {
        name: 'Maximum Consecutive Shifts',
        description:
          'Manufacturing staff should not work more than 6 consecutive shifts',
        ruleType: RuleType.MAX_CONSECUTIVE_SHIFTS,
        severity: RuleSeverity.WARNING,
        scope: RuleScope.ORGANIZATION,
        category: OrganizationCategory.MANUFACTURING,
        parameters: {
          maxConsecutiveShifts: 6,
        },
        errorMessage:
          'Staff member is scheduled for more than 6 consecutive shifts',
      },
      {
        name: 'Minimum Rest After Night Shift',
        description:
          'Manufacturing staff must have at least 24 hours rest after a night shift',
        ruleType: RuleType.REST_PERIOD,
        severity: RuleSeverity.ERROR,
        scope: RuleScope.SHIFT_TYPE,
        category: OrganizationCategory.MANUFACTURING,
        parameters: {
          minimumRestHours: 24,
          applyToShiftTypes: ['Third Shift', 'Night Shift'],
        },
        errorMessage: 'Staff must have 24 hours rest after working night shift',
      },

      // Retail rules
      {
        name: 'Retail Break Requirements',
        description:
          'Retail staff must have a 30-minute break during shifts over 6 hours',
        ruleType: RuleType.CUSTOM,
        severity: RuleSeverity.INFO,
        scope: RuleScope.ORGANIZATION,
        category: OrganizationCategory.RETAIL,
        parameters: {
          minimumBreakMinutes: 30,
          applyToShiftsLongerThanHours: 6,
        },
        errorMessage: 'Staff needs a 30-minute break for shifts over 6 hours',
      },

      // Hospitality rules
      {
        name: 'Split Shift Restriction',
        description:
          'Hospitality staff should not have more than 2 split shifts per week',
        ruleType: RuleType.CUSTOM,
        severity: RuleSeverity.WARNING,
        scope: RuleScope.ORGANIZATION,
        category: OrganizationCategory.HOSPITALITY,
        parameters: {
          maxSplitShiftsPerWeek: 2,
        },
        errorMessage:
          'Staff is scheduled for more than 2 split shifts this week',
      },
    ];
  }

  /**
   * Generate a rotation pattern template for organizations to use
   * Note: This will need to be customized with actual shift type IDs
   */
  generateRotationPatternTemplate(
    category: string,
    patternType: string
  ): Partial<ShiftRotationPattern> {
    // These are just templates and will need to be modified
    // with actual shift type IDs when applied to an organization

    switch (patternType) {
      case 'continental':
        return {
          name: 'Continental Rotation (Template)',
          description:
            '4 teams, 8-hour shifts, rotating through morning, afternoon, night, and off days',
          category,
          sequence: [], // Will be populated with actual IDs
          cycleLength: 28, // 4 weeks
          breaks: [
            { durationDays: 2, description: 'Weekend off', isPaid: false },
            { durationDays: 3, description: 'Mid-week off', isPaid: false },
          ],
        };

      case '4on4off':
        return {
          name: '4 On, 4 Off Rotation (Template)',
          description: '4 days on, 4 days off - typically 12-hour shifts',
          category,
          sequence: [], // Will be populated with actual IDs
          cycleLength: 8, // 8 days
          breaks: [{ durationDays: 4, description: 'Days off', isPaid: false }],
        };

      case 'panama':
        return {
          name: 'Panama Rotation (Template)',
          description:
            '2 days on, 2 days off, 3 days on, 2 days off, 2 days on, 3 days off',
          category,
          sequence: [], // Will be populated with actual IDs
          cycleLength: 14, // 2 weeks
          breaks: [
            { durationDays: 2, description: 'First break', isPaid: false },
            { durationDays: 2, description: 'Second break', isPaid: false },
            { durationDays: 3, description: 'Third break', isPaid: false },
          ],
        };

      default:
        return {
          name: 'Basic Rotation (Template)',
          description: 'Basic weekly rotation pattern',
          category,
          sequence: [], // Will be populated with actual IDs
          cycleLength: 7, // 1 week
          breaks: [{ durationDays: 2, description: 'Weekend', isPaid: false }],
        };
    }
  }

  /**
   * Apply system rules to an organization
   */
  async applySystemRulesToOrganization(
    organizationId: string,
    category: string
  ): Promise<SchedulingRuleDocument[]> {
    // Find all system rules for this category
    const systemRules = await this.schedulingRuleModel
      .find({
        isSystem: true,
        category,
      })
      .lean();

    const createdRules: SchedulingRuleDocument[] = [];

    // Create organization-specific rules from the templates
    for (const rule of systemRules) {
      const { _id, isSystem, ...ruleData } = rule;

      const newRule = new this.schedulingRuleModel({
        ...ruleData,
        organizationId,
        isSystem: false,
        isActive: true,
      });

      const savedRule = await newRule.save();
      createdRules.push(savedRule);
    }

    return createdRules;
  }
}

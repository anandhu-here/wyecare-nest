// libs/api/features/src/lib/shifts/services/scheduling-rules.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateSchedulingRuleDto } from '../dto/create-scheduling-rule.dto';
import { UpdateSchedulingRuleDto } from '../dto/update-scheduling-rule.dto';
import { SystemTemplatesService } from './system-templates.service';
import {
  SchedulingRule,
  SchedulingRuleDocument,
} from 'libs/api/core/src/lib/schemas';

interface SchedulingRuleQueryOptions {
  ruleType?: string;
  scope?: string;
  isActive?: boolean;
  search?: string;
}

@Injectable()
export class SchedulingRulesService {
  private readonly logger = new Logger(SchedulingRulesService.name);

  constructor(
    @InjectModel(SchedulingRule.name)
    private schedulingRuleModel: Model<SchedulingRuleDocument>,

    private systemTemplatesService: SystemTemplatesService
  ) {}

  async create(
    createSchedulingRuleDto: CreateSchedulingRuleDto
  ): Promise<SchedulingRuleDocument> {
    try {
      const newSchedulingRule = new this.schedulingRuleModel({
        ...createSchedulingRuleDto,
        organizationId: new Types.ObjectId(
          createSchedulingRuleDto.organizationId
        ),
        scopeEntityId: createSchedulingRuleDto.scopeEntityId
          ? new Types.ObjectId(createSchedulingRuleDto.scopeEntityId)
          : undefined,
        isActive:
          createSchedulingRuleDto.isActive !== undefined
            ? createSchedulingRuleDto.isActive
            : true,
      });

      return await newSchedulingRule.save();
    } catch (error: any) {
      this.logger.error(
        `Error creating scheduling rule: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async findAll(
    organizationId: string,
    options: SchedulingRuleQueryOptions = {}
  ): Promise<SchedulingRuleDocument[]> {
    try {
      const { ruleType, scope, isActive, search } = options;

      // Build query
      const query: any = { organizationId: new Types.ObjectId(organizationId) };

      if (ruleType) {
        query.ruleType = ruleType;
      }

      if (scope) {
        query.scope = scope;
      }

      if (isActive !== undefined) {
        query.isActive = isActive;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      return await this.schedulingRuleModel
        .find(query)
        .sort({ name: 1 })
        .lean()
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error finding scheduling rules: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async findOne(
    id: string,
    organizationId: string
  ): Promise<SchedulingRuleDocument> {
    try {
      const schedulingRule = await this.schedulingRuleModel
        .findOne({
          _id: new Types.ObjectId(id),
          organizationId: new Types.ObjectId(organizationId),
        })
        .exec();

      if (!schedulingRule) {
        throw new NotFoundException(`Scheduling rule with ID ${id} not found`);
      }

      return schedulingRule;
    } catch (error: any) {
      this.logger.error(
        `Error finding scheduling rule: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async update(
    id: string,
    organizationId: string,
    updateSchedulingRuleDto: UpdateSchedulingRuleDto
  ): Promise<SchedulingRuleDocument> {
    try {
      // Prepare update data
      const updateData: any = { ...updateSchedulingRuleDto };

      // Convert string IDs to ObjectIds if provided
      if (updateData.scopeEntityId) {
        updateData.scopeEntityId = new Types.ObjectId(updateData.scopeEntityId);
      }

      const updatedSchedulingRule = await this.schedulingRuleModel
        .findOneAndUpdate(
          {
            _id: new Types.ObjectId(id),
            organizationId: new Types.ObjectId(organizationId),
          },
          { $set: updateData },
          { new: true }
        )
        .exec();

      if (!updatedSchedulingRule) {
        throw new NotFoundException(`Scheduling rule with ID ${id} not found`);
      }

      return updatedSchedulingRule;
    } catch (error: any) {
      this.logger.error(
        `Error updating scheduling rule: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async remove(
    id: string,
    organizationId: string
  ): Promise<{ deleted: boolean }> {
    try {
      const result = await this.schedulingRuleModel
        .deleteOne({
          _id: new Types.ObjectId(id),
          organizationId: new Types.ObjectId(organizationId),
        })
        .exec();

      if (result.deletedCount === 0) {
        throw new NotFoundException(`Scheduling rule with ID ${id} not found`);
      }

      return { deleted: true };
    } catch (error: any) {
      this.logger.error(
        `Error removing scheduling rule: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get system rule templates for a specific organization category
   */
  async getSystemRuleTemplates(
    category: string
  ): Promise<SchedulingRuleDocument[]> {
    try {
      return await this.schedulingRuleModel
        .find({
          category,
          isSystem: true,
        })
        .sort({ name: 1 })
        .lean()
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error getting system rule templates: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Apply system rule templates to a specific organization
   */
  async applySystemRulesToOrganization(
    organizationId: string,
    category: string
  ): Promise<SchedulingRuleDocument[]> {
    try {
      // Check if organization already has rules
      const existingRules = await this.schedulingRuleModel.countDocuments({
        organizationId: new Types.ObjectId(organizationId),
      });

      // If organization already has rules, don't apply templates
      if (existingRules > 0) {
        this.logger.log(
          `Organization ${organizationId} already has ${existingRules} rules. Skipping template application.`
        );
        return [];
      }

      // Apply templates through system templates service
      return await this.systemTemplatesService.applySystemRulesToOrganization(
        organizationId,
        category
      );
    } catch (error: any) {
      this.logger.error(
        `Error applying system rules to organization: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Validate a schedule against all active rules
   * This is a simplified version - in production, you would implement
   * a more sophisticated rules engine
   */
  async validateScheduleAgainstRules(
    organizationId: string,
    scheduleData: any
  ): Promise<any[]> {
    try {
      // Get all active rules for this organization
      const rules = await this.schedulingRuleModel
        .find({
          organizationId: new Types.ObjectId(organizationId),
          isActive: true,
        })
        .lean();

      // Placeholder for rule validation logic
      // This would be implemented based on your specific requirements
      const violations: any[] = [];

      // For each rule, check the schedule
      for (const rule of rules) {
        // Simple example - in production, you would build a robust rule engine
        switch (rule.ruleType) {
          case 'rest_period':
            // Check for minimum rest periods between shifts
            // Code would go here
            break;

          case 'max_consecutive_shifts':
            // Check for maximum consecutive shifts
            // Code would go here
            break;

          // Add more rule types as needed
        }
      }

      return violations;
    } catch (error: any) {
      this.logger.error(
        `Error validating schedule against rules: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}

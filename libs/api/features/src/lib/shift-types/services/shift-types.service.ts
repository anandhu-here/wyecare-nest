// shift-types.service.ts
// libs/api/features/src/lib/shifts/services/shift-types.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateShiftTypeDto } from '../dto/create-shift-type.dto';
import { UpdateShiftTypeDto } from '../dto/update-shift-type.dto';
import {
  ShiftTemplate,
  ShiftTemplateDocument,
  ShiftType,
  ShiftTypeDocument,
} from 'libs/api/core/src/lib/schemas';

interface ShiftTypeQueryOptions {
  category?: string;
  isActive?: boolean;
  search?: string;
}

@Injectable()
export class ShiftTypesService {
  private readonly logger = new Logger(ShiftTypesService.name);

  constructor(
    @InjectModel(ShiftType.name)
    private shiftTypeModel: Model<ShiftTypeDocument>,

    @InjectModel(ShiftTemplate.name)
    private shiftTemplateModel: Model<ShiftTemplateDocument>
  ) {}

  async create(
    createShiftTypeDto: CreateShiftTypeDto
  ): Promise<ShiftTypeDocument> {
    try {
      const newShiftType = new this.shiftTypeModel({
        ...createShiftTypeDto,
        organizationId: new Types.ObjectId(createShiftTypeDto.organizationId),
      });

      // Calculate duration if not provided
      if (
        createShiftTypeDto.defaultTiming &&
        !createShiftTypeDto.defaultTiming.durationMinutes
      ) {
        if (newShiftType.defaultTiming) {
          newShiftType.defaultTiming.durationMinutes =
            this.calculateDurationMinutes(
              createShiftTypeDto.defaultTiming.startTime,
              createShiftTypeDto.defaultTiming.endTime,
              createShiftTypeDto.defaultTiming.isOvernight || false
            );
        }
      }

      return await newShiftType.save();
    } catch (error: any) {
      this.logger.error(
        `Error creating shift type: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async findAll(
    organizationId: string,
    options: ShiftTypeQueryOptions = {}
  ): Promise<ShiftTypeDocument[]> {
    try {
      const { category, isActive, search } = options;

      // Build query
      const query: any = { organizationId: new Types.ObjectId(organizationId) };

      if (category) {
        query.category = category;
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

      return await this.shiftTypeModel
        .find(query)
        .sort({ name: 1 })
        .lean()
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error finding shift types: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async findOne(
    id: string,
    organizationId: string
  ): Promise<ShiftTypeDocument> {
    try {
      const shiftType = await this.shiftTypeModel
        .findOne({
          _id: new Types.ObjectId(id),
          organizationId: new Types.ObjectId(organizationId),
        })
        .exec();

      if (!shiftType) {
        throw new NotFoundException(`Shift type with ID ${id} not found`);
      }

      return shiftType;
    } catch (error: any) {
      this.logger.error(
        `Error finding shift type: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async update(
    id: string,
    organizationId: string,
    updateShiftTypeDto: UpdateShiftTypeDto
  ): Promise<ShiftTypeDocument> {
    try {
      // Calculate duration if timing is being updated
      if (updateShiftTypeDto.defaultTiming) {
        updateShiftTypeDto.defaultTiming.durationMinutes =
          this.calculateDurationMinutes(
            updateShiftTypeDto.defaultTiming.startTime,
            updateShiftTypeDto.defaultTiming.endTime,
            updateShiftTypeDto.defaultTiming.isOvernight || false
          );
      }

      const updatedShiftType = await this.shiftTypeModel
        .findOneAndUpdate(
          {
            _id: new Types.ObjectId(id),
            organizationId: new Types.ObjectId(organizationId),
          },
          { $set: updateShiftTypeDto },
          { new: true }
        )
        .exec();

      if (!updatedShiftType) {
        throw new NotFoundException(`Shift type with ID ${id} not found`);
      }

      return updatedShiftType;
    } catch (error: any) {
      this.logger.error(
        `Error updating shift type: ${error.message}`,
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
      const result = await this.shiftTypeModel
        .deleteOne({
          _id: new Types.ObjectId(id),
          organizationId: new Types.ObjectId(organizationId),
        })
        .exec();

      if (result.deletedCount === 0) {
        throw new NotFoundException(`Shift type with ID ${id} not found`);
      }

      return { deleted: true };
    } catch (error: any) {
      this.logger.error(
        `Error removing shift type: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get shift templates for a specific organization category
   */
  async getShiftTemplates(category: string): Promise<ShiftTemplateDocument[]> {
    try {
      return await this.shiftTemplateModel
        .find({
          category,
          isSystem: true,
          isActive: true,
        })
        .sort({ name: 1 })
        .lean()
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error getting shift templates: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Apply a template to create a new shift type
   */
  async applyTemplate(
    templateId: string,
    organizationId: string,
    customizations?: Partial<CreateShiftTypeDto>
  ): Promise<ShiftTypeDocument> {
    try {
      // Find the template
      const template = await this.shiftTemplateModel.findById(templateId);

      if (!template) {
        throw new NotFoundException(`Template with ID ${templateId} not found`);
      }

      // Create a new shift type based on the template
      const newShiftType = new this.shiftTypeModel({
        name: template.name,
        description: template.description,
        category: template.category,
        organizationId: new Types.ObjectId(organizationId),
        defaultTiming: template.defaultTiming,
        color: template.color,
        icon: template.icon,
        applicableDays: template.applicableDays,
        isActive: true,
        metadata: template.metadata,
        ...customizations, // Override with any custom values
      });

      return await newShiftType.save();
    } catch (error: any) {
      this.logger.error(
        `Error applying template: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  // Helper to calculate duration in minutes
  private calculateDurationMinutes(
    startTime: string,
    endTime: string,
    isOvernight: boolean
  ): number {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    let startMinutes = startHour * 60 + startMinute;
    let endMinutes = endHour * 60 + endMinute;

    if (isOvernight && endMinutes <= startMinutes) {
      // If it's an overnight shift, add 24 hours to end time
      endMinutes += 24 * 60;
    }

    return endMinutes - startMinutes;
  }
}

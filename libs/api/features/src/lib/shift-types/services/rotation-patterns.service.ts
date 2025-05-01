// libs/api/features/src/lib/shifts/services/rotation-patterns.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateRotationPatternDto } from '../dto/create-rotation-pattern.dto';
import { UpdateRotationPatternDto } from '../dto/update-rotation-pattern.dto';
import { SystemTemplatesService } from './system-templates.service';
import {
  ShiftRotationPattern,
  ShiftRotationPatternDocument,
} from 'libs/api/core/src/lib/schemas';

interface RotationPatternQueryOptions {
  isActive?: boolean;
  search?: string;
}

@Injectable()
export class RotationPatternsService {
  private readonly logger = new Logger(RotationPatternsService.name);

  constructor(
    @InjectModel(ShiftRotationPattern.name)
    private rotationPatternModel: Model<ShiftRotationPatternDocument>,

    private systemTemplatesService: SystemTemplatesService
  ) {}

  async create(
    createRotationPatternDto: CreateRotationPatternDto
  ): Promise<ShiftRotationPatternDocument> {
    try {
      // Convert string IDs to ObjectIds
      const newRotationPattern = new this.rotationPatternModel({
        ...createRotationPatternDto,
        organizationId: new Types.ObjectId(
          createRotationPatternDto.organizationId
        ),
        departmentId: createRotationPatternDto.departmentId
          ? new Types.ObjectId(createRotationPatternDto.departmentId)
          : undefined,
        sequence: createRotationPatternDto.sequence.map((item) => ({
          ...item,
          shiftTypeId: new Types.ObjectId(item.shiftTypeId),
        })),
        applicableStaff: createRotationPatternDto.applicableStaff?.map(
          (id) => new Types.ObjectId(id)
        ),
        applicableRoles: createRotationPatternDto.applicableRoles?.map(
          (id) => new Types.ObjectId(id)
        ),
        isActive:
          createRotationPatternDto.isActive !== undefined
            ? createRotationPatternDto.isActive
            : true,
      });

      return await newRotationPattern.save();
    } catch (error: any) {
      this.logger.error(
        `Error creating rotation pattern: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async findAll(
    organizationId: string,
    options: RotationPatternQueryOptions = {}
  ): Promise<ShiftRotationPatternDocument[]> {
    try {
      const { isActive, search } = options;

      // Build query
      const query: any = { organizationId: new Types.ObjectId(organizationId) };

      if (isActive !== undefined) {
        query.isActive = isActive;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      return await this.rotationPatternModel
        .find(query)
        .sort({ name: 1 })
        .lean()
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error finding rotation patterns: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async findOne(
    id: string,
    organizationId: string
  ): Promise<ShiftRotationPatternDocument> {
    try {
      const rotationPattern = await this.rotationPatternModel
        .findOne({
          _id: new Types.ObjectId(id),
          organizationId: new Types.ObjectId(organizationId),
        })
        .exec();

      if (!rotationPattern) {
        throw new NotFoundException(`Rotation pattern with ID ${id} not found`);
      }

      return rotationPattern;
    } catch (error: any) {
      this.logger.error(
        `Error finding rotation pattern: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async update(
    id: string,
    organizationId: string,
    updateRotationPatternDto: UpdateRotationPatternDto
  ): Promise<ShiftRotationPatternDocument> {
    try {
      // Prepare update data
      const updateData: any = { ...updateRotationPatternDto };

      // Convert string IDs to ObjectIds if provided
      if (updateData.departmentId) {
        updateData.departmentId = new Types.ObjectId(updateData.departmentId);
      }

      if (updateData.sequence) {
        updateData.sequence = updateData.sequence.map((item: any) => ({
          ...item,
          shiftTypeId: new Types.ObjectId(item.shiftTypeId),
        }));
      }

      if (updateData.applicableStaff) {
        updateData.applicableStaff = updateData.applicableStaff.map(
          (id: string) => new Types.ObjectId(id)
        );
      }

      if (updateData.applicableRoles) {
        updateData.applicableRoles = updateData.applicableRoles.map(
          (id: string) => new Types.ObjectId(id)
        );
      }

      const updatedRotationPattern = await this.rotationPatternModel
        .findOneAndUpdate(
          {
            _id: new Types.ObjectId(id),
            organizationId: new Types.ObjectId(organizationId),
          },
          { $set: updateData },
          { new: true }
        )
        .exec();

      if (!updatedRotationPattern) {
        throw new NotFoundException(`Rotation pattern with ID ${id} not found`);
      }

      return updatedRotationPattern;
    } catch (error: any) {
      this.logger.error(
        `Error updating rotation pattern: ${error.message}`,
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
      const result = await this.rotationPatternModel
        .deleteOne({
          _id: new Types.ObjectId(id),
          organizationId: new Types.ObjectId(organizationId),
        })
        .exec();

      if (result.deletedCount === 0) {
        throw new NotFoundException(`Rotation pattern with ID ${id} not found`);
      }

      return { deleted: true };
    } catch (error: any) {
      this.logger.error(
        `Error removing rotation pattern: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get a rotation pattern template
   */
  async getRotationPatternTemplate(
    category: string,
    patternType: string
  ): Promise<any> {
    try {
      // Get template from system templates service
      return this.systemTemplatesService.generateRotationPatternTemplate(
        category,
        patternType
      );
    } catch (error: any) {
      this.logger.error(
        `Error getting rotation pattern template: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Generate shift schedules based on a rotation pattern
   */
  async generateSchedule(
    patternId: string,
    startDate: Date,
    durationDays: number,
    staffId?: string
  ): Promise<any[]> {
    try {
      // Get the rotation pattern
      const pattern = await this.rotationPatternModel.findById(patternId);

      if (!pattern) {
        throw new NotFoundException(
          `Rotation pattern with ID ${patternId} not found`
        );
      }

      // Placeholder for shift generation logic
      // In a production implementation, you would:
      // 1. Calculate the number of cycles needed to cover the duration
      // 2. For each day in the duration, determine which shift from the pattern applies
      // 3. Create shift assignments based on the pattern

      // This is just a simplified example
      const generatedShifts: any[] = [];

      // Logic would go here

      return generatedShifts;
    } catch (error: any) {
      this.logger.error(
        `Error generating schedule from rotation pattern: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}

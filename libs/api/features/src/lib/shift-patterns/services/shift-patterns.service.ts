import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ShiftPattern,
  ShiftPatternDocument,
} from '../schemas/shift-pattern.schema';
import { CreateShiftPatternDto } from '../dto/create-shift-pattern.dto';
import { UpdateShiftPatternDto } from '../dto/update-shift-pattern.dto';
import { CreateAgencyShiftPatternDto } from '../dto/reate-agency-shift-pattern.dto';

@Injectable()
export class ShiftPatternsService {
  private readonly logger = new Logger(ShiftPatternsService.name);

  constructor(
    @InjectModel(ShiftPattern.name)
    private shiftPatternModel: Model<ShiftPatternDocument>
  ) {}

  async create(
    createShiftPatternDto: CreateShiftPatternDto,
    userId: string
  ): Promise<ShiftPatternDocument> {
    try {
      const newShiftPattern = new this.shiftPatternModel({
        ...createShiftPatternDto,
        userId: new Types.ObjectId(userId),
      });
      return await newShiftPattern.save();
    } catch (error: any) {
      this.logger.error(
        `Error creating shift pattern: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
  async createAgencyShiftPattern(
    createAgencyShiftPatternDto: CreateAgencyShiftPatternDto,
    agencyId: string
  ): Promise<ShiftPatternDocument> {
    try {
      // Transform the agency-specific DTO into the standard format
      const rates = [];
      const userTypeRates = [] as any[];

      // Process home rates for each home and user type
      for (const homeRate of createAgencyShiftPatternDto.homeRates) {
        // Add carer rates
        rates.push({
          careHomeId: homeRate.careHomeId,
          userType: 'carer',
          weekdayRate: homeRate.carerWeekdayRate,
          weekendRate: homeRate.carerWeekendRate,
          holidayRate: homeRate.carerHolidayRate,
          emergencyWeekdayRate: homeRate.carerEmergencyWeekdayRate,
          emergencyWeekendRate: homeRate.carerEmergencyWeekendRate,
          emergencyHolidayRate: homeRate.carerEmergencyHolidayRate,
        });

        // Add nurse rates
        rates.push({
          careHomeId: homeRate.careHomeId,
          userType: 'nurse',
          weekdayRate: homeRate.nurseWeekdayRate,
          weekendRate: homeRate.nurseWeekendRate,
          holidayRate: homeRate.nurseHolidayRate,
          emergencyWeekdayRate: homeRate.nurseEmergencyWeekdayRate,
          emergencyWeekendRate: homeRate.nurseEmergencyWeekendRate,
          emergencyHolidayRate: homeRate.nurseEmergencyHolidayRate,
        });

        // Add senior carer rates
        rates.push({
          careHomeId: homeRate.careHomeId,
          userType: 'senior_carer',
          weekdayRate: homeRate.seniorCarerWeekdayRate,
          weekendRate: homeRate.seniorCarerWeekendRate,
          holidayRate: homeRate.seniorCarerHolidayRate,
          emergencyWeekdayRate: homeRate.seniorCarerEmergencyWeekdayRate,
          emergencyWeekendRate: homeRate.seniorCarerEmergencyWeekendRate,
          emergencyHolidayRate: homeRate.seniorCarerEmergencyHolidayRate,
        });
      }

      // Create and save the shift pattern
      const newShiftPattern = new this.shiftPatternModel({
        name: createAgencyShiftPatternDto.name,
        userId: new Types.ObjectId(agencyId),
        rates,
        userTypeRates,
        timings: createAgencyShiftPatternDto.timings,
      });

      return await newShiftPattern.save();
    } catch (error: any) {
      this.logger.error(
        `Error creating agency shift pattern: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async findAll(userId: string): Promise<ShiftPatternDocument[]> {
    try {
      return await this.shiftPatternModel
        .find({ userId: new Types.ObjectId(userId) })
        .lean()
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error finding shift patterns: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async findOne(id: string, userId: string): Promise<ShiftPatternDocument> {
    try {
      const shiftPattern = await this.shiftPatternModel
        .findOne({
          _id: new Types.ObjectId(id),
          userId: new Types.ObjectId(userId),
        })
        .exec();

      if (!shiftPattern) {
        throw new NotFoundException(`Shift pattern with ID ${id} not found`);
      }

      return shiftPattern;
    } catch (error: any) {
      this.logger.error(
        `Error finding shift pattern: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async findTimingByHomeId(
    shiftPatternId: string,
    homeId: string
  ): Promise<any> {
    try {
      const shiftPattern = await this.shiftPatternModel
        .findById(shiftPatternId)
        .lean();

      if (!shiftPattern) {
        throw new NotFoundException(
          `Shift pattern with ID ${shiftPatternId} not found`
        );
      }

      const timing = shiftPattern.timings?.find(
        (timing) => timing.careHomeId === homeId
      );

      if (!timing) {
        throw new NotFoundException(
          `Timing for home ID ${homeId} not found in shift pattern ${shiftPatternId}`
        );
      }

      return timing;
    } catch (error: any) {
      this.logger.error(
        `Error finding timing by home ID: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async update(
    id: string,
    userId: string,
    updateShiftPatternDto: UpdateShiftPatternDto
  ): Promise<ShiftPatternDocument> {
    try {
      const updatedShiftPattern = await this.shiftPatternModel
        .findOneAndUpdate(
          {
            _id: new Types.ObjectId(id),
            userId: new Types.ObjectId(userId),
          },
          { $set: updateShiftPatternDto },
          { new: true }
        )
        .exec();

      if (!updatedShiftPattern) {
        throw new NotFoundException(`Shift pattern with ID ${id} not found`);
      }

      return updatedShiftPattern;
    } catch (error: any) {
      this.logger.error(
        `Error updating shift pattern: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async remove(id: string, userId: string): Promise<{ deleted: boolean }> {
    try {
      const result = await this.shiftPatternModel
        .deleteOne({
          _id: new Types.ObjectId(id),
          userId: new Types.ObjectId(userId),
        })
        .exec();

      if (result.deletedCount === 0) {
        throw new NotFoundException(`Shift pattern with ID ${id} not found`);
      }

      return { deleted: true };
    } catch (error: any) {
      this.logger.error(
        `Error removing shift pattern: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}

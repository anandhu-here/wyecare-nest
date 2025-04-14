// api/features/src/lib/shifts/services/shifts.service.ts
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Shift, ShiftDocument } from '../schemas/shift.schema';
import { CreateShiftDto } from '../dto/create-shift.dto';
import { UpdateShiftDto } from '../dto/update-shift.dto';
import * as moment from 'moment';
import {
  ShiftAssignment,
  ShiftAssignmentDocument,
  ShiftAssignmentStatus,
} from '../schemas/shift-assignment.schema';
import { CreateShiftAssignmentDto } from '../dto/create-shift-assignment.dto';
import { UpdateShiftAssignmentDto } from '../dto/update-shift-assignment.dto';

@Injectable()
export class ShiftsService {
  private readonly logger = new Logger(ShiftsService.name);

  constructor(
    @InjectModel(Shift.name) private shiftModel: Model<ShiftDocument>,
    @InjectModel(ShiftAssignment.name)
    private shiftAssignmentModel: Model<ShiftAssignmentDocument>
  ) {}

  async create(createShiftDto: CreateShiftDto): Promise<ShiftDocument> {
    try {
      const newShift = new this.shiftModel(createShiftDto);
      return await newShift.save();
    } catch (error: any) {
      this.logger.error(`Error creating shift: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(): Promise<ShiftDocument[]> {
    try {
      return await this.shiftModel.find().exec();
    } catch (error: any) {
      this.logger.error(`Error finding shifts: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string): Promise<any> {
    try {
      return await this.shiftModel.findById(id).exec();
    } catch (error: any) {
      this.logger.error(`Error finding shift: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, updateShiftDto: UpdateShiftDto): Promise<any> {
    try {
      return await this.shiftModel
        .findByIdAndUpdate(id, updateShiftDto, { new: true })
        .exec();
    } catch (error: any) {
      this.logger.error(`Error updating shift: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    try {
      const result = await this.shiftModel.deleteOne({ _id: id }).exec();
      return { deleted: result.deletedCount > 0 };
    } catch (error: any) {
      this.logger.error(`Error removing shift: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getShiftsByDate(date: string, orgId: string): Promise<ShiftDocument[]> {
    try {
      return await this.shiftModel
        .find({
          date: date,
          $or: [
            { homeId: new Types.ObjectId(orgId) },
            { agentId: new Types.ObjectId(orgId) },
          ],
        })
        .populate('homeId')
        .populate('agentId')
        .populate('assignedUsers')
        .populate('preferredStaff')
        .populate('shiftPattern')
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error getting shifts by date: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async getPubShifts(
    orgId: string,
    month?: number,
    year?: number
  ): Promise<ShiftDocument[]> {
    try {
      let query: any = { homeId: new Types.ObjectId(orgId) };

      if (month && year) {
        const monthStr = month.toString().padStart(2, '0');
        query.date = { $regex: `^${year}-${monthStr}-` };
      }

      return await this.shiftModel
        .find(query)
        .populate('homeId')
        .populate('agentId')
        .populate('assignedUsers')
        .populate('preferredStaff')
        .populate('shiftPattern')
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error getting published shifts: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async getAgencyShifts(
    agencyId: string,
    month?: number,
    year?: number
  ): Promise<ShiftDocument[]> {
    try {
      let query: any = { agentId: new Types.ObjectId(agencyId) };

      if (month && year) {
        const monthStr = month.toString().padStart(2, '0');
        query.date = { $regex: `^${year}-${monthStr}-` };
      }

      return await this.shiftModel
        .find(query)
        .populate('homeId')
        .populate('agentId')
        .populate('assignedUsers')
        .populate('preferredStaff')
        .populate('shiftPattern')
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error getting agency shifts: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async acceptShift(shiftId: string): Promise<any> {
    try {
      return await this.shiftModel
        .findByIdAndUpdate(
          shiftId,
          { isAccepted: true, isRejected: false },
          { new: true }
        )
        .exec();
    } catch (error: any) {
      this.logger.error(`Error accepting shift: ${error.message}`, error.stack);
      throw error;
    }
  }

  async rejectShift(shiftId: string): Promise<any> {
    try {
      return await this.shiftModel
        .findByIdAndUpdate(
          shiftId,
          { isRejected: true, agentId: undefined, isAccepted: false },
          { new: true }
        )
        .exec();
    } catch (error: any) {
      this.logger.error(`Error rejecting shift: ${error.message}`, error.stack);
      throw error;
    }
  }

  async createMultipleShifts(
    shiftsData: CreateShiftDto[],
    homeId: string,
    needsApproval = false
  ): Promise<ShiftDocument[]> {
    try {
      const objectId = new Types.ObjectId(homeId);

      // Create all shifts
      const shifts = await Promise.all(
        shiftsData.map(async (shiftData) => {
          const newShift = new this.shiftModel({
            ...shiftData,
            homeId: objectId,
            needsApproval: needsApproval,
            agencyAccepted: shiftData.isTemporaryHome
              ? true
              : needsApproval
              ? true
              : false,
          });
          return newShift.save();
        })
      );

      // Return populated shifts
      const populatedShifts = await this.shiftModel
        .find({
          _id: { $in: shifts.map((shift) => shift._id) },
        })
        .populate('homeId')
        .populate('agentId')
        .populate('preferredStaff')
        .populate('shiftPattern')
        .exec();

      return populatedShifts;
    } catch (error: any) {
      this.logger.error(
        `Error creating multiple shifts: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  // Shift Assignment Methods
  async createAssignment(
    createShiftAssignmentDto: CreateShiftAssignmentDto
  ): Promise<ShiftAssignmentDocument> {
    try {
      // Check if shift exists
      const shift = await this.shiftModel.findById(
        createShiftAssignmentDto.shift
      );
      if (!shift) {
        throw new NotFoundException(
          `Shift with ID ${createShiftAssignmentDto.shift} not found`
        );
      }

      // Check if user is already assigned to this shift
      const existingAssignment = await this.shiftAssignmentModel.findOne({
        shift: new Types.ObjectId(createShiftAssignmentDto.shift),
        user: new Types.ObjectId(createShiftAssignmentDto.user),
      });

      if (existingAssignment) {
        throw new BadRequestException('User is already assigned to this shift');
      }

      // Create the assignment
      const newAssignment = new this.shiftAssignmentModel({
        shift: new Types.ObjectId(createShiftAssignmentDto.shift),
        user: new Types.ObjectId(createShiftAssignmentDto.user),
        status:
          createShiftAssignmentDto.status || ShiftAssignmentStatus.ASSIGNED,
      });

      // Update the shift's assignedUsers array
      await this.shiftModel.findByIdAndUpdate(createShiftAssignmentDto.shift, {
        $addToSet: {
          assignedUsers: new Types.ObjectId(createShiftAssignmentDto.user),
        },
        isAccepted: true,
      });

      return await newAssignment.save();
    } catch (error: any) {
      this.logger.error(
        `Error creating shift assignment: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async getAssignmentsByShift(
    shiftId: string
  ): Promise<ShiftAssignmentDocument[]> {
    try {
      return await this.shiftAssignmentModel
        .find({ shift: new Types.ObjectId(shiftId) })
        .populate('user')
        .populate({
          path: 'shift',
          populate: [
            { path: 'homeId' },
            { path: 'agentId' },
            { path: 'shiftPattern' },
          ],
        })
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error getting assignments by shift: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async getAssignmentsByUser(
    userId: string,
    orgId?: string
  ): Promise<ShiftAssignmentDocument[]> {
    try {
      let query: any = { user: new Types.ObjectId(userId) };

      if (orgId) {
        // If orgId is provided, filter assignments for shifts in that organization
        const shifts = await this.shiftModel
          .find({
            $or: [
              { homeId: new Types.ObjectId(orgId) },
              { agentId: new Types.ObjectId(orgId) },
            ],
          })
          .select('_id');

        const shiftIds = shifts.map((shift) => shift._id);
        query.shift = { $in: shiftIds };
      }

      return await this.shiftAssignmentModel
        .find(query)
        .populate('user')
        .populate({
          path: 'shift',
          populate: [
            { path: 'homeId' },
            { path: 'agentId' },
            { path: 'shiftPattern' },
          ],
        })
        .sort({ createdAt: -1 })
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error getting assignments by user: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async updateAssignment(
    id: string,
    updateShiftAssignmentDto: UpdateShiftAssignmentDto
  ): Promise<any> {
    try {
      const assignment = await this.shiftAssignmentModel.findById(id);
      if (!assignment) {
        throw new NotFoundException(`Assignment with ID ${id} not found`);
      }

      // Update shift status based on assignment status if needed
      if (updateShiftAssignmentDto.status) {
        switch (updateShiftAssignmentDto.status) {
          case ShiftAssignmentStatus.COMPLETED:
          case ShiftAssignmentStatus.SIGNED:
            await this.updateShiftStatusIfNeeded(assignment.shift as any);
            break;
        }
      }

      return await this.shiftAssignmentModel
        .findByIdAndUpdate(id, updateShiftAssignmentDto, { new: true })
        .populate('user')
        .populate({
          path: 'shift',
          populate: [
            { path: 'homeId' },
            { path: 'agentId' },
            { path: 'shiftPattern' },
          ],
        })
        .exec();
    } catch (error: any) {
      this.logger.error(
        `Error updating assignment: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async removeAssignment(id: string): Promise<{ deleted: boolean }> {
    try {
      const assignment = await this.shiftAssignmentModel.findById(id);
      if (!assignment) {
        throw new NotFoundException(`Assignment with ID ${id} not found`);
      }

      // Remove user from shift's assignedUsers array
      await this.shiftModel.findByIdAndUpdate(assignment.shift, {
        $pull: { assignedUsers: assignment.user },
      });

      // Delete the assignment
      const result = await this.shiftAssignmentModel
        .deleteOne({ _id: id })
        .exec();

      // Update shift status if needed (no more assignments)
      const remainingAssignments =
        await this.shiftAssignmentModel.countDocuments({
          shift: assignment.shift,
        });

      if (remainingAssignments === 0) {
        await this.shiftModel.findByIdAndUpdate(assignment.shift, {
          isAccepted: false,
        });
      }

      return { deleted: result.deletedCount > 0 };
    } catch (error: any) {
      this.logger.error(
        `Error removing assignment: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async assignMultipleUsers(
    shiftId: string,
    userIds: string[]
  ): Promise<ShiftAssignmentDocument[]> {
    try {
      const shift = await this.shiftModel.findById(shiftId);
      if (!shift) {
        throw new NotFoundException(`Shift with ID ${shiftId} not found`);
      }

      // Get existing assignments for this shift
      const existingAssignments = await this.shiftAssignmentModel.find({
        shift: new Types.ObjectId(shiftId),
        user: { $in: userIds.map((id) => new Types.ObjectId(id)) },
      });

      const existingUserIds = existingAssignments.map((assignment) =>
        assignment.user.toString()
      );

      // Filter out users that are already assigned
      const newUserIds = userIds.filter(
        (userId) => !existingUserIds.includes(userId)
      );

      // Create assignments for new users
      const newAssignments = await Promise.all(
        newUserIds.map(async (userId) => {
          const newAssignment = new this.shiftAssignmentModel({
            shift: new Types.ObjectId(shiftId),
            user: new Types.ObjectId(userId),
            status: ShiftAssignmentStatus.ASSIGNED,
          });
          return newAssignment.save();
        })
      );

      // Update the shift's assignedUsers array
      await this.shiftModel.findByIdAndUpdate(shiftId, {
        $addToSet: {
          assignedUsers: {
            $each: newUserIds.map((id) => new Types.ObjectId(id)),
          },
        },
        isAccepted: true,
      });

      // Return all assignments for this shift
      return await this.getAssignmentsByShift(shiftId);
    } catch (error: any) {
      this.logger.error(
        `Error assigning multiple users: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async swapAssignedUsers(
    shiftId: string,
    oldUserId: string,
    newUserId: string
  ): Promise<{ success: boolean }> {
    try {
      // Check if the old user is assigned to this shift
      const oldAssignment = await this.shiftAssignmentModel.findOne({
        shift: new Types.ObjectId(shiftId),
        user: new Types.ObjectId(oldUserId),
      });

      if (!oldAssignment) {
        throw new BadRequestException('Old user is not assigned to this shift');
      }

      // Check if the new user is already assigned to this shift
      const newAssignment = await this.shiftAssignmentModel.findOne({
        shift: new Types.ObjectId(shiftId),
        user: new Types.ObjectId(newUserId),
      });

      if (newAssignment) {
        throw new BadRequestException(
          'New user is already assigned to this shift'
        );
      }

      // Update the assignment with the new user
      await this.shiftAssignmentModel.findByIdAndUpdate(oldAssignment._id, {
        user: new Types.ObjectId(newUserId),
      });

      // Update the shift's assignedUsers array
      await this.shiftModel.findByIdAndUpdate(shiftId, {
        $pull: { assignedUsers: new Types.ObjectId(oldUserId) },
        $addToSet: { assignedUsers: new Types.ObjectId(newUserId) },
      });

      return { success: true };
    } catch (error: any) {
      this.logger.error(
        `Error swapping assigned users: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  private async updateShiftStatusIfNeeded(
    shiftId: Types.ObjectId
  ): Promise<void> {
    try {
      const allAssignments = await this.shiftAssignmentModel.find({
        shift: shiftId,
      });

      // Check if all assignments are completed or signed
      const allCompleted = allAssignments.every(
        (assignment) =>
          assignment.status === ShiftAssignmentStatus.COMPLETED ||
          assignment.status === ShiftAssignmentStatus.SIGNED
      );

      if (allCompleted) {
        await this.shiftModel.findByIdAndUpdate(shiftId, {
          isCompleted: true,
          isDone: true,
        });
      }
    } catch (error: any) {
      this.logger.error(
        `Error updating shift status: ${error.message}`,
        error.stack
      );
    }
  }
}

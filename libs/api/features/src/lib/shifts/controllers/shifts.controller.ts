// api/features/src/lib/shifts/controllers/shifts.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
  Req,
  Logger,
  HttpStatus,
  HttpException,
  Res,
} from '@nestjs/common';
import { ShiftsService } from '../services/shifts.service';
import { CreateShiftDto } from '../dto/create-shift.dto';
import { UpdateShiftDto } from '../dto/update-shift.dto';
import { JwtAuthGuard } from '../../authentication/jwt/jwt-auth.guard';
import { PermissionGuard } from '../../authorization/permission.guard';
import { Auth } from '../../authorization/auth.decorator';
import { CreateShiftAssignmentDto } from '../dto/create-shift-assignment.dto';
import { UpdateShiftAssignmentDto } from '../dto/update-shift-assignment.dto';
import { OrganizationContextGuard } from '../../organizations/organization-context.guard';
import { RequirePermission } from '../../authorization/permissions.decorator';
import { AuthGuard } from '@nestjs/passport';
import { OrganizationAccessGuard } from '../../authorization/organization-access.guard';
import { DashboardService } from '../services/dashboard.service';

@Controller('shifts')
@UseGuards(JwtAuthGuard)
export class ShiftsController {
  private readonly logger = new Logger(ShiftsController.name);

  constructor(
    private readonly shiftsService: ShiftsService,
    private readonly dashboardService: DashboardService
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  @RequirePermission('create_shift')
  async create(@Body() createShiftDto: CreateShiftDto, @Req() req: any) {
    try {
      return await this.shiftsService.create(createShiftDto);
    } catch (error: any) {
      this.logger.error(`Error creating shift: ${error.message}`, error.stack);
      throw new HttpException(
        'Error creating shift',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  async findAll(@Req() req: any) {
    try {
      return await this.shiftsService.findAll();
    } catch (error: any) {
      this.logger.error(`Error finding shifts: ${error.message}`, error.stack);
      throw new HttpException(
        'Error finding shifts',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.shiftsService.findOne(id);
    } catch (error: any) {
      this.logger.error(`Error finding shift: ${error.message}`, error.stack);
      throw new HttpException(
        'Error finding shift',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':id')
  @UseGuards(PermissionGuard)
  @Auth('edit_shift')
  async update(
    @Param('id') id: string,
    @Body() updateShiftDto: UpdateShiftDto
  ) {
    try {
      return await this.shiftsService.update(id, updateShiftDto);
    } catch (error: any) {
      this.logger.error(`Error updating shift: ${error.message}`, error.stack);
      throw new HttpException(
        'Error updating shift',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  @UseGuards(PermissionGuard)
  @Auth('delete_shift')
  async remove(@Param('id') id: string) {
    try {
      return await this.shiftsService.remove(id);
    } catch (error: any) {
      this.logger.error(`Error removing shift: ${error.message}`, error.stack);
      throw new HttpException(
        'Error removing shift',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('by-date/:date')
  @RequirePermission('view_shift')
  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  async getShiftsByDate(@Param('date') date: string, @Req() req: any) {
    try {
      const organizationId = req.currentOrganization._id.toString();
      return await this.shiftsService.getShiftsByDate(date, organizationId);
    } catch (error: any) {
      this.logger.error(
        `Error getting shifts by date: ${error.message}`,
        error.stack
      );
      throw new HttpException(
        'Error getting shifts by date',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('home/:orgId')
  @Auth('view_shift')
  async getPubShifts(
    @Param('orgId') orgId: string,
    @Query('month') month?: number,
    @Query('year') year?: number
  ) {
    try {
      console.log('andi');
      return await this.shiftsService.getPubShifts(orgId, month, year);
    } catch (error: any) {
      this.logger.error(
        `Error getting home shifts: ${error.message}`,
        error.stack
      );
      throw new HttpException(
        'Error getting home shifts',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('agency/:agencyId')
  async getAgencyShifts(
    @Param('agencyId') agencyId: string,
    @Query('month') month?: number,
    @Query('year') year?: number
  ) {
    try {
      return await this.shiftsService.getAgencyShifts(agencyId, month, year);
    } catch (error: any) {
      this.logger.error(
        `Error getting agency shifts: ${error.message}`,
        error.stack
      );
      throw new HttpException(
        'Error getting agency shifts',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('accept/:id')
  @UseGuards(PermissionGuard)
  @Auth('UPDATE_SHIFT')
  async acceptShift(@Param('id') id: string) {
    try {
      return await this.shiftsService.acceptShift(id);
    } catch (error: any) {
      this.logger.error(`Error accepting shift: ${error.message}`, error.stack);
      throw new HttpException(
        'Error accepting shift',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('reject/:id')
  @UseGuards(PermissionGuard)
  @Auth('UPDATE_SHIFT')
  async rejectShift(@Param('id') id: string) {
    try {
      return await this.shiftsService.rejectShift(id);
    } catch (error: any) {
      this.logger.error(`Error rejecting shift: ${error.message}`, error.stack);
      throw new HttpException(
        'Error rejecting shift',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('bulk')
  @UseGuards(PermissionGuard)
  @Auth('create_shift')
  async createMultipleShifts(
    @Body() body: { shifts: CreateShiftDto[]; needsApproval?: boolean },
    @Req() req: any
  ) {
    try {
      const organizationId = req.currentOrganization._id.toString();
      return await this.shiftsService.createMultipleShifts(
        body.shifts,
        organizationId,
        body.needsApproval || false
      );
    } catch (error: any) {
      this.logger.error(
        `Error creating multiple shifts: ${error.message}`,
        error.stack
      );
      throw new HttpException(
        'Error creating multiple shifts',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  @Post('assignments')
  @Auth('CREATE_SHIFT_ASSIGNMENT')
  async createAssignment(
    @Body() createShiftAssignmentDto: CreateShiftAssignmentDto
  ) {
    try {
      return await this.shiftsService.createAssignment(
        createShiftAssignmentDto
      );
    } catch (error: any) {
      this.logger.error(
        `Error creating shift assignment: ${error.message}`,
        error.stack
      );
      throw new HttpException(
        error.message || 'Error creating shift assignment',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('assignments/shift/:shiftId')
  async getAssignmentsByShift(@Param('shiftId') shiftId: string) {
    try {
      return await this.shiftsService.getAssignmentsByShift(shiftId);
    } catch (error: any) {
      this.logger.error(
        `Error getting assignments by shift: ${error.message}`,
        error.stack
      );
      throw new HttpException(
        error.message || 'Error getting assignments by shift',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('assignments/user/:userId')
  async getAssignmentsByUser(
    @Param('userId') userId: string,
    @Query('orgId') orgId?: string
  ) {
    try {
      return await this.shiftsService.getAssignmentsByUser(userId, orgId);
    } catch (error: any) {
      this.logger.error(
        `Error getting assignments by user: ${error.message}`,
        error.stack
      );
      throw new HttpException(
        error.message || 'Error getting assignments by user',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('assignments/:id')
  @Auth('UPDATE_SHIFT_ASSIGNMENT')
  async updateAssignment(
    @Param('id') id: string,
    @Body() updateShiftAssignmentDto: UpdateShiftAssignmentDto
  ) {
    try {
      return await this.shiftsService.updateAssignment(
        id,
        updateShiftAssignmentDto
      );
    } catch (error: any) {
      this.logger.error(
        `Error updating assignment: ${error.message}`,
        error.stack
      );
      throw new HttpException(
        error.message || 'Error updating assignment',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('assignments/:id')
  @Auth('DELETE_SHIFT_ASSIGNMENT')
  async removeAssignment(@Param('id') id: string) {
    try {
      return await this.shiftsService.removeAssignment(id);
    } catch (error: any) {
      this.logger.error(
        `Error removing assignment: ${error.message}`,
        error.stack
      );
      throw new HttpException(
        error.message || 'Error removing assignment',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('assignments/multiple/:shiftId')
  @Auth('CREATE_SHIFT_ASSIGNMENT')
  async assignMultipleUsers(
    @Param('shiftId') shiftId: string,
    @Body() body: { userIds: string[] }
  ) {
    try {
      return await this.shiftsService.assignMultipleUsers(
        shiftId,
        body.userIds
      );
    } catch (error: any) {
      this.logger.error(
        `Error assigning multiple users: ${error.message}`,
        error.stack
      );
      throw new HttpException(
        error.message || 'Error assigning multiple users',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('assignments/swap/:shiftId')
  @Auth('UPDATE_SHIFT_ASSIGNMENT')
  async swapAssignedUsers(
    @Param('shiftId') shiftId: string,
    @Body() body: { oldUserId: string; newUserId: string }
  ) {
    try {
      return await this.shiftsService.swapAssignedUsers(
        shiftId,
        body.oldUserId,
        body.newUserId
      );
    } catch (error: any) {
      this.logger.error(
        `Error swapping assigned users: ${error.message}`,
        error.stack
      );
      throw new HttpException(
        error.message || 'Error swapping assigned users',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // quick stats

  @Get('dashboard/quick-stats')
  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  async getQuickStats(
    @Req() req: any,
    @Res() res: any,
    @Query('month') month?: string,
    @Query('year') year?: string
  ) {
    try {
      console.log(req.currentOrganization, 'peri');
      const currentUser = req.user;
      const type = req.currentOrganization?.type;
      const currentDate = new Date();
      const monthNum = month ? parseInt(month, 10) : currentDate.getMonth() + 1;
      const yearNum = year ? parseInt(year, 10) : currentDate.getFullYear();

      let stats;
      if (['carer', 'nurse', 'senior_carer'].includes(currentUser.role)) {
        stats = await this.dashboardService.getCarerQuickStats(
          currentUser._id.toString(),
          monthNum,
          yearNum
        );
      } else if (type === 'agency') {
        stats = await this.dashboardService.getAgencyQuickStats(
          req.currentOrganization?._id?.toString(),
          monthNum,
          yearNum
        );
      } else if (type === 'home') {
        stats = await this.dashboardService.getHomeQuickStats(
          req.currentOrganization?._id?.toString(),
          monthNum,
          yearNum
        );
      } else {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Invalid organization type or user role',
        });
      }

      return res.status(HttpStatus.OK).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.log(error, 'error');
      this.logger.error('Error getting quick stats:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

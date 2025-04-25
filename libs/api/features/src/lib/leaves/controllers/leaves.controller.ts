// leaves.controller.ts
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
  HttpStatus,
  HttpCode,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../authentication/jwt/jwt-auth.guard';
import { RequirePermission } from '../../authorization/permissions.decorator';
import { LeaveManagementService } from '../services/leaves.service';
import { CreateLeaveRequestDto } from '../dto/create-leave-request.dto';
import { UpdateLeaveStatusDto } from '../dto/update-leave-status.dto';
import { InvalidateLeaveRequestDto } from '../dto/invalidate-leave-request.dto';
import { CancelLeaveRequestDto } from '../dto/cancel-leave-request.dto';
import { GetLeaveRequestsDto } from '../dto/get-leave-requests.dto';
import { Types } from 'mongoose';
import { OrganizationContextGuard } from '../../organizations/organization-context.guard';

@Controller('leave-management')
@UseGuards(JwtAuthGuard)
export class LeaveManagementController {
  constructor(
    private readonly leaveManagementService: LeaveManagementService
  ) {}

  /**
   * Create a new leave request
   */
  @Post('requests')
  @RequirePermission('create:leave_request')
  @UseGuards(OrganizationContextGuard)
  async createLeaveRequest(
    @Body() createLeaveRequestDto: CreateLeaveRequestDto,
    @Req() req: any
  ) {
    const userId = req.user._id.toString();
    const organizationId = req.currentOrganization._id.toString();

    const leaveRequest = await this.leaveManagementService.createLeaveRequest(
      userId,
      organizationId,
      createLeaveRequestDto
    );

    return {
      success: true,
      message: 'Leave request created successfully',
      data: leaveRequest,
    };
  }

  /**
   * Get all leave requests (for admin)
   */
  @Get('requests/organization/:organizationId')
  @RequirePermission('view:leave_requests')
  async getLeaveRequests(
    @Param('organizationId') organizationId: string,
    @Query() queryParams: GetLeaveRequestsDto
  ) {
    // Validate ID format
    if (!Types.ObjectId.isValid(organizationId)) {
      throw new BadRequestException('Invalid organization ID format');
    }

    const { page = 1, limit = 10, ...filters } = queryParams;

    const result = await this.leaveManagementService.getLeaveRequests(
      {
        ...filters,
        organization: organizationId,
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      },
      { page, limit }
    );

    return {
      success: true,
      data: result.requests,
      pagination: result.pagination,
    };
  }

  /**
   * Get user's leave balance
   */
  @Get('balance')
  @RequirePermission('view:leave_balance')
  @UseGuards(OrganizationContextGuard)
  async getOwnLeaveBalance(@Req() req: any) {
    const userId = req.user._id.toString();
    const organizationId = req.currentOrganization._id.toString();

    const balance = await this.leaveManagementService.getOrCreateLeaveBalance(
      userId,
      organizationId
    );

    return {
      success: true,
      data: balance,
    };
  }

  /**
   * Get specific user's leave balance (admin only)
   */
  @Get('balance/:organizationId/:userId')
  @RequirePermission('view:all_leave_balances')
  async getUserLeaveBalance(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string
  ) {
    // Validate ID formats
    if (
      !Types.ObjectId.isValid(organizationId) ||
      !Types.ObjectId.isValid(userId)
    ) {
      throw new BadRequestException('Invalid ID format');
    }

    const balance = await this.leaveManagementService.getOrCreateLeaveBalance(
      userId,
      organizationId
    );

    return {
      success: true,
      data: balance,
    };
  }

  /**
   * Update leave request status (approve/reject)
   */
  @Put('requests/:requestId/status')
  @RequirePermission('manage:leave_requests')
  @UseGuards(OrganizationContextGuard)
  async updateLeaveStatus(
    @Param('requestId') requestId: string,
    @Body() updateStatusDto: UpdateLeaveStatusDto,
    @Req() req: any
  ) {
    if (!Types.ObjectId.isValid(requestId)) {
      throw new BadRequestException('Invalid request ID format');
    }

    const approverUserId = req.user._id.toString();

    const updatedRequest = await this.leaveManagementService.updateLeaveStatus(
      requestId,
      updateStatusDto.status,
      approverUserId,
      updateStatusDto.comments
    );

    return {
      success: true,
      message: `Leave request ${updateStatusDto.status.toLowerCase()} successfully`,
      data: updatedRequest,
    };
  }

  /**
   * Check for leave conflicts
   */
  @Post('check-conflicts')
  @RequirePermission('create:leave_request')
  @UseGuards(OrganizationContextGuard)
  async checkLeaveConflicts(
    @Body() checkDto: { startDateTime: string; endDateTime: string },
    @Req() req: any
  ) {
    const userId = req.user._id.toString();
    const organizationId = req.currentOrganization._id.toString();
    const { startDateTime, endDateTime } = checkDto;

    const hasConflict = await this.leaveManagementService.checkLeaveConflicts(
      userId,
      organizationId,
      new Date(startDateTime),
      new Date(endDateTime)
    );

    return {
      success: true,
      data: {
        hasConflict,
        message: hasConflict
          ? 'Date range conflicts with existing leave request'
          : 'No conflicts found',
      },
    };
  }

  /**
   * Manage organization leave policy
   */
  @Put('policy')
  @RequirePermission('manage:leave_policy')
  @UseGuards(OrganizationContextGuard)
  async upsertLeavePolicy(@Body() policyData: any, @Req() req: any) {
    const organizationId = req.currentOrganization._id.toString();

    const policy = await this.leaveManagementService.upsertLeavePolicy(
      organizationId,
      policyData
    );

    return {
      success: true,
      message: 'Leave policy updated successfully',
      data: policy,
    };
  }

  /**
   * Get organization leave policy
   */
  @Get('policy')
  @RequirePermission('view:leave_policy')
  @UseGuards(OrganizationContextGuard)
  async getLeavePolicy(@Req() req: any) {
    const organizationId = req.currentOrganization._id.toString();

    const policy = await this.leaveManagementService.getLeavePolicy(
      organizationId
    );

    return {
      success: true,
      data: policy,
    };
  }

  /**
   * Get leave types for organization
   */
  @Get('leave-types')
  @UseGuards(OrganizationContextGuard)
  async getLeaveTypes(@Req() req: any) {
    const organizationId = req.currentOrganization._id.toString();

    const leaveTypes = await this.leaveManagementService.getLeaveTypes(
      organizationId
    );

    return {
      success: true,
      data: leaveTypes.leaveTypes,
    };
  }

  /**
   * Delete a leave policy
   */
  @Delete('policy/:policyId')
  @RequirePermission('manage:leave_policy')
  @UseGuards(OrganizationContextGuard)
  @HttpCode(HttpStatus.OK)
  async deleteLeavePolicy(
    @Param('policyId') policyId: string,
    @Req() req: any
  ) {
    if (!Types.ObjectId.isValid(policyId)) {
      throw new BadRequestException('Invalid policy ID format');
    }

    const organizationId = req.currentOrganization._id.toString();

    await this.leaveManagementService.deleteLeavePolicy(
      organizationId,
      policyId
    );

    return {
      success: true,
      message: 'Leave policy deleted successfully',
    };
  }

  /**
   * Invalidate a leave request (admin)
   */
  @Put('requests/:requestId/invalidate')
  @RequirePermission('manage:leave_requests')
  @UseGuards(OrganizationContextGuard)
  async invalidateLeaveRequest(
    @Param('requestId') requestId: string,
    @Body() invalidateDto: InvalidateLeaveRequestDto,
    @Req() req: any
  ) {
    if (!Types.ObjectId.isValid(requestId)) {
      throw new BadRequestException('Invalid request ID format');
    }

    const adminUserId = req.user._id.toString();

    const result = await this.leaveManagementService.invalidateLeaveRequest(
      requestId,
      adminUserId,
      invalidateDto.reason
    );

    return {
      success: true,
      message: 'Leave request invalidated successfully',
      data: result,
    };
  }

  /**
   * Cancel a leave request (self)
   */
  @Put('requests/:requestId/cancel')
  @UseGuards(OrganizationContextGuard)
  async cancelLeaveRequest(
    @Param('requestId') requestId: string,
    @Body() cancelDto: CancelLeaveRequestDto,
    @Req() req: any
  ) {
    if (!Types.ObjectId.isValid(requestId)) {
      throw new BadRequestException('Invalid request ID format');
    }

    const userId = req.user._id.toString();

    const result = await this.leaveManagementService.cancelLeaveRequest(
      requestId,
      userId,
      cancelDto.reason
    );

    return {
      success: true,
      message: 'Leave request cancelled successfully',
      data: result,
    };
  }

  /**
   * Get a single leave request by ID
   */
  @Get('requests/:requestId')
  @UseGuards(OrganizationContextGuard)
  async getLeaveRequest(
    @Param('requestId') requestId: string,
    @Req() req: any
  ) {
    if (!Types.ObjectId.isValid(requestId)) {
      throw new BadRequestException('Invalid request ID format');
    }

    const organizationId = req.currentOrganization._id.toString();

    const leaveRequest = await this.leaveManagementService.getLeaveRequestById(
      requestId,
      organizationId
    );

    return {
      success: true,
      data: leaveRequest,
    };
  }

  /**
   * Delete a leave request
   */
  @Delete('requests/:requestId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OrganizationContextGuard)
  async deleteLeaveRequest(
    @Param('requestId') requestId: string,
    @Req() req: any
  ) {
    if (!Types.ObjectId.isValid(requestId)) {
      throw new BadRequestException('Invalid request ID format');
    }

    const userId = req.user._id.toString();
    const organizationId = req.currentOrganization._id.toString();

    await this.leaveManagementService.deleteLeaveRequest(
      requestId,
      organizationId,
      userId
    );

    return {
      success: true,
      message: 'Leave request deleted successfully',
    };
  }

  /**
   * Manually trigger leave accrual calculation (admin only)
   */
  @Post('process-accruals')
  @RequirePermission('manage:leave_policy')
  @HttpCode(HttpStatus.OK)
  async processLeaveAccruals() {
    const processedCount =
      await this.leaveManagementService.processLeaveAccruals();

    return {
      success: true,
      message: `Processed accruals for ${processedCount} user balance records`,
    };
  }
}

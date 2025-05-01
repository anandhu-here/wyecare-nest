import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpStatus,
  Res,
  NotFoundException,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { Types } from 'mongoose';
import { RequirePermission } from '../../authorization/permissions.decorator';
import { JwtAuthGuard } from '../../authentication/jwt/jwt-auth.guard';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';
import { RemoveUserFromOrganizationDto } from '../dto/remove-user-from-organization.dto';
import { AddUserToOrganizationDto } from '../dto/add-user-to-organization.dto';
import { OrganizationStaffService } from '../services/organization-staff.service';
import { OrganizationAccessGuard } from '../../authorization/organization-access.guard';
import { OrganizationContextGuard } from '../organization-context.guard';
import { CreateStaffInvitationDto } from '../dto/create-staff-invitation.dto';
import { Auth } from '../../authorization/auth.decorator';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationStaffController {
  constructor(
    private readonly organizationStaffService: OrganizationStaffService
  ) {}

  @Get('staff/paginated')
  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  @RequirePermission('view_staff')
  async getStaffPaginated(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('sortBy') sortBy = 'createdAt',
    @Query('sortOrder') sortOrder = 'desc',
    @Res() res: Response,
    @Req() req: any,

    @Query('staffType') staffType?: string,
    @Query('role') role?: string,
    @Query('search') search?: string
  ) {
    try {
      const organizationId = req.currentOrganization._id;
      const result = await this.organizationStaffService.getStaffPaginated(
        organizationId,
        parseInt(page as any),
        parseInt(limit as any),
        staffType,
        role,
        search,
        sortBy,
        sortOrder as any
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: result.staff,
        pagination: {
          total: result.total,
          page: parseInt(page as any),
          limit: parseInt(limit as any),
          totalPages: Math.ceil(result.total / parseInt(limit as any)),
        },
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to get paginated staff',
      });
    }
  }

  @Get('staff/availability/shift')
  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  @RequirePermission('view_staff')
  async getAvailableStaffForShift(
    @Query('shiftPatternId') shiftPatternId: string,
    @Query('shiftDate') shiftDate: string,
    @Query('careHomeId') careHomeId: string,
    @Res() res: Response,
    @Req() req: any
  ) {
    try {
      if (!shiftPatternId || !shiftDate || !careHomeId) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message:
            'Missing required parameters: shiftPatternId, shiftDate, or careHomeId',
        });
      }

      console.log(req.currentOrganization?._id, 'mairu org');
      console.log(shiftPatternId, 'mairu pattern');

      const availableStaff =
        await this.organizationStaffService.getAvailableStaffForShift(
          req.currentOrganization?._id,
          shiftPatternId,
          shiftDate,
          careHomeId
        );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: availableStaff.data,
        meta: {
          total: availableStaff.data.length,
          availableCount: availableStaff.data.filter(
            (staff) => staff.availability.isAvailable
          ).length,
        },
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to get available staff for shift',
      });
    }
  }

  @Get(':organizationId/staff/availability/dateRange')
  @UseGuards(OrganizationAccessGuard)
  @RequirePermission('view_staff')
  async getStaffAvailabilityForDateRange(
    @Param('organizationId') organizationId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response
  ) {
    try {
      if (!startDate || !endDate) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Missing required parameters: startDate or endDate',
        });
      }

      const availabilityMap =
        await this.organizationStaffService.getStaffAvailabilityForDateRange(
          organizationId,
          startDate,
          endDate
        );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: availabilityMap,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message:
          error.message || 'Failed to get staff availability for date range',
      });
    }
  }

  @Get(':organizationId/staff/matching')
  @UseGuards(OrganizationAccessGuard)
  @RequirePermission('view_staff')
  async getMatchingStaffForShift(
    @Param('organizationId') organizationId: string,
    @Query('shiftPatternId') shiftPatternId: string,
    @Query('shiftDate') shiftDate: string,
    @Query('careHomeId') careHomeId: string,
    @Body() requirements: any,
    @Res() res: Response
  ) {
    try {
      if (!shiftPatternId || !shiftDate || !careHomeId) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message:
            'Missing required parameters: shiftPatternId, shiftDate, or careHomeId',
        });
      }

      const matchingStaff = {
        data: {},
        meta: {},
      };
      return res.status(HttpStatus.OK).json({
        success: true,
        data: matchingStaff.data,
        meta: matchingStaff.meta,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to get matching staff for shift',
      });
    }
  }

  @Post(':organizationId/staff/:staffId/favorite')
  @UseGuards(OrganizationAccessGuard)
  @RequirePermission('manage_staff')
  async addFavoriteStaff(
    @Param('organizationId') organizationId: string,
    @Param('staffId') staffId: string,
    @Res() res: Response
  ) {
    try {
      const result = await this.organizationStaffService.addFavoriteStaff(
        organizationId,
        staffId
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Staff added to favorites successfully',
        data: result,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to add staff to favorites',
      });
    }
  }

  @Delete(':organizationId/staff/:staffId/favorite')
  @UseGuards(OrganizationAccessGuard)
  @RequirePermission('manage_staff')
  async removeFavoriteStaff(
    @Param('organizationId') organizationId: string,
    @Param('staffId') staffId: string,
    @Res() res: Response
  ) {
    try {
      const result = await this.organizationStaffService.removeFavoriteStaff(
        organizationId,
        staffId
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Staff removed from favorites successfully',
        data: result,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to remove staff from favorites',
      });
    }
  }

  @Get(':organizationId/staff/favorites')
  @UseGuards(OrganizationAccessGuard)
  @RequirePermission('view_staff')
  async getFavoriteStaff(
    @Param('organizationId') organizationId: string,
    @Res() res: Response
  ) {
    try {
      const favorites = await this.organizationStaffService.getFavoriteStaff(
        organizationId
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: favorites,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to get favorite staff',
      });
    }
  }

  @Post(':organizationId/staff/:staffId/notes')
  @UseGuards(OrganizationAccessGuard)
  @RequirePermission('manage_staff')
  async addFavoriteStaffNote(
    @Param('organizationId') organizationId: string,
    @Param('staffId') staffId: string,
    @Body('note') note: string,
    @Res() res: Response
  ) {
    try {
      const result = await this.organizationStaffService.addFavoriteStaffNote(
        organizationId,
        staffId,
        note
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Note added to favorite staff successfully',
        data: result,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to add note to favorite staff',
      });
    }
  }

  @Get(':organizationId/staff/payments')
  @UseGuards(OrganizationAccessGuard)
  @RequirePermission('view_staff_payments')
  async calculateStaffPayments(
    @Param('organizationId') organizationId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('staffIds') staffIds: string,
    @Res() res: Response
  ) {
    try {
      if (!startDate || !endDate || !staffIds) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message:
            'Missing required parameters: startDate, endDate, or staffIds',
        });
      }

      const staffIdArray = staffIds.split(',');
      const payments =
        await this.organizationStaffService.calculateStaffPayments(
          startDate,
          endDate,
          staffIdArray
        );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: payments,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to calculate staff payments',
      });
    }
  }

  // This method depends on the Staff Leave feature which hasn't been implemented yet
  /*
@Get(':organizationId/staff/:staffId/leave')
@UseGuards(OrganizationAccessGuard)
@RequirePermission('view_staff')
async checkStaffLeave(
  @Param('organizationId') organizationId: string,
  @Param('staffId') staffId: string,
  @Query('shiftDate') shiftDate: string,
  @Query('startTime') startTime: string,
  @Query('endTime') endTime: string,
  @Res() res: Response
) {
  try {
    if (!shiftDate || !startTime || !endTime) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Missing required parameters: shiftDate, startTime, or endTime',
      });
    }

    const isNotOnLeave = await this.organizationStaffService.checkStaffLeave(
      staffId,
      shiftDate,
      startTime,
      endTime
    );

    return res.status(HttpStatus.OK).json({
      success: true,
      data: {
        isOnLeave: !isNotOnLeave,
      },
    });
  } catch (error: any) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to check staff leave status',
    });
  }
}
*/

  @Post('/addUser')
  @RequirePermission('add_staff')
  async addUserToOrganization(
    @Body() addUserDto: AddUserToOrganizationDto,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const result = await this.organizationStaffService.addUserToOrganization(
        addUserDto,
        req.user._id
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'User added to organization successfully',
        data: result,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to add user to organization',
      });
    }
  }

  @Get('/:organizationId/staff')
  @UseGuards(OrganizationAccessGuard)
  @RequirePermission('view_staff')
  async getOrganizationStaff(
    @Param('organizationId') organizationId: string,
    @Res() res: Response
  ) {
    try {
      const staff = await this.organizationStaffService.getOrganizationStaff(
        new Types.ObjectId(organizationId)
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: staff,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to get organization staff',
      });
    }
  }

  @Get('/user/:userId')
  @RequirePermission('view_organization')
  async getOrganizationsByUser(
    @Param('userId') userId: string,
    @Res() res: Response
  ) {
    try {
      const organizations =
        await this.organizationStaffService.getOrganizationsByUser(
          new Types.ObjectId(userId)
        );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: organizations,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to get user organizations',
      });
    }
  }

  @Get('/role/:organizationId')
  async getOrganizationRole(
    @Param('organizationId') organizationId: string,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const role = await this.organizationStaffService.getOrganizationRole(
        req.user._id,
        new Types.ObjectId(organizationId)
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: role,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to get user role',
      });
    }
  }

  @Put('/updateUserRole')
  @RequirePermission('edit_staff_role')
  async updateUserRole(
    @Body() updateRoleDto: UpdateUserRoleDto,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const result = await this.organizationStaffService.updateUserRole(
        updateRoleDto,
        req.user._id
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'User role updated successfully',
        data: result,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to update user role',
      });
    }
  }

  @Delete('/removeUser')
  @RequirePermission('remove_staff')
  async removeUserFromOrganization(
    @Body() removeUserDto: RemoveUserFromOrganizationDto,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const result =
        await this.organizationStaffService.removeUserFromOrganization(
          removeUserDto,
          req.user._id
        );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'User removed from organization successfully',
        data: result,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to remove user from organization',
      });
    }
  }

  @Post('/staff/invitations')
  @UseGuards(JwtAuthGuard, OrganizationContextGuard, JwtAuthGuard)
  @RequirePermission('invite_staff')
  async createStaffInvitation(
    @Body() createInvitationDto: CreateStaffInvitationDto,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const organizationId = req.currentOrganization._id;
      console.log(
        'Creating staff invitation for organizationId:',
        organizationId,
        'createInvitationDto:',
        createInvitationDto
      );
      const invitation =
        await this.organizationStaffService.createStaffInvitation(
          new Types.ObjectId(organizationId),
          createInvitationDto,
          req.user._id
        );

      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Staff invitation created successfully',
        invitation,
      });
    } catch (error: any) {
      console.error('Error creating staff invitation:', error);
      if (error instanceof BadRequestException) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to create staff invitation',
      });
    }
  }

  @Get('/staff/invitations/verify/:token')
  async verifyStaffInvitation(
    @Param('token') token: string,
    @Res() res: Response
  ) {
    try {
      const invitation =
        await this.organizationStaffService.verifyStaffInvitationToken(token);

      // Check if user with this email already exists
      const existingUser = await this.organizationStaffService.findUserByEmail(
        invitation.email
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        invitation: {
          organizationName: invitation.organizationName,
          role: invitation.roleName,
          email: invitation.email,
          expiresAt: invitation.expiresAt,
        },
        userExists: !!existingUser,
        // Include appropriate redirect URL based on user existence
        redirectUrl: existingUser
          ? `/auth/accept-invitation?token=${token}&type=staff`
          : `/auth/register-with-invitation?token=${token}&type=staff`,
      });
    } catch (error) {
      // Error handling
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'failed to verify invitation token',
      });
    }
  }

  @Post('/staff/invitations/accept')
  @UseGuards(JwtAuthGuard)
  async acceptStaffInvitation(
    @Body('token') token: string,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const userId = req.user._id;

      const result = await this.organizationStaffService.acceptStaffInvitation(
        token,
        userId
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Successfully joined organization',
        organization: result.organization,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'failed to accept invitation token',
      });
    }
  }

  @Delete(':organizationId/staff/invitations/:invitationId')
  @UseGuards(OrganizationAccessGuard)
  @RequirePermission('manage_staff_invitations')
  async cancelStaffInvitation(
    @Param('organizationId') organizationId: string,
    @Param('invitationId') invitationId: string,
    @Res() res: Response
  ) {
    try {
      await this.organizationStaffService.cancelStaffInvitation(
        new Types.ObjectId(organizationId),
        new Types.ObjectId(invitationId)
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Staff invitation cancelled successfully',
      });
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to cancel staff invitation',
      });
    }
  }

  @Post(':organizationId/staff/invitations/:invitationId/resend')
  @UseGuards(OrganizationAccessGuard)
  @RequirePermission('manage_staff_invitations')
  async resendStaffInvitation(
    @Param('organizationId') organizationId: string,
    @Param('invitationId') invitationId: string,
    @Res() res: Response
  ) {
    try {
      const invitation =
        await this.organizationStaffService.resendStaffInvitation(
          new Types.ObjectId(organizationId),
          new Types.ObjectId(invitationId)
        );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Staff invitation resent successfully',
        invitation,
      });
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to resend staff invitation',
      });
    }
  }

  // Additional endpoints
  @Get(':organizationId/staff/specialized')
  @UseGuards(OrganizationAccessGuard)
  @RequirePermission('view_staff')
  async getSpecializedStaff(
    @Param('organizationId') organizationId: string,
    @Query('organizationType') organizationType: string,
    @Res() res: Response
  ) {
    try {
      const staff = await this.organizationStaffService.getSpecializedStaff(
        new Types.ObjectId(organizationId),
        organizationType
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: staff,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to get specialized staff',
      });
    }
  }

  @Get(':organizationId/staff/admin')
  @UseGuards(OrganizationAccessGuard)
  @RequirePermission('view_staff')
  async getAdminStaff(
    @Param('organizationId') organizationId: string,
    @Res() res: Response
  ) {
    try {
      const staff = await this.organizationStaffService.getAdminStaff(
        new Types.ObjectId(organizationId)
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: staff,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to get admin staff',
      });
    }
  }
}

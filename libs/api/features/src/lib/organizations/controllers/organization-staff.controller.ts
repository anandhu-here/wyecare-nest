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

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationStaffController {
  constructor(
    private readonly organizationStaffService: OrganizationStaffService
  ) {}

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
}

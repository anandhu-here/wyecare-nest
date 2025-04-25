import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  Res,
  All,
} from '@nestjs/common';

import { Response } from 'express';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../../authentication/jwt/jwt-auth.guard';
import { RequirePermission } from '../../authorization/permissions.decorator';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';
import { OrganizationsService } from '../services/organizations.service';
import { PermissionGuard } from '../../authorization/permission.guard';
import { Auth } from '../../authorization/auth.decorator';
import { OrganizationAccessGuard } from '../../authorization/organization-access.guard';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('/test')
  @UseGuards(JwtAuthGuard)
  testEndpoint(@Req() req: any) {
    return {
      success: true,
      message: 'Test endpoint',
      user: req.user ? true : false,
    };
  }
  @Post('/test-permissions')
  @UseGuards(JwtAuthGuard)
  @UseGuards(PermissionGuard)
  @RequirePermission('create_organization')
  async testPermissions(@Req() req: any, @Res() res: Response) {
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Permission check passed',
      user: req.user._id,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @RequirePermission('create_organization')
  async createOrganization(
    @Body() createOrganizationDto: CreateOrganizationDto,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      console.log(req.user, 'User in createOrganization method');
      const result = await this.organizationsService.createOrganization(
        createOrganizationDto,
        req.user
      );

      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Organization created successfully',
        data: result,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to create organization',
      });
    }
  }

  @Get()
  @Auth('view_organization')
  async getMyOrganization(@Req() req: any, @Res() res: Response) {
    try {
      const organization = await this.organizationsService.getMyOrganization(
        req.user._id
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: organization,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch organization',
      });
    }
  }

  @Patch(':id')
  @Auth('edit_organization')
  async updateOrganization(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      console.log('Received ID:', id);
      console.log('Received DTO:', JSON.stringify(updateOrganizationDto));

      // Use the ID from the URL parameter instead of req.currentOrganization
      const result = await this.organizationsService.updateOrganization(
        id as any,
        updateOrganizationDto
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Organization updated successfully',
        data: result,
      });
    } catch (error: any) {
      console.log(error, 'Error in updateOrganization method');
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to update organization',
      });
    }
  }

  @Post('/request-org-deletion')
  @RequirePermission('delete_organization')
  async requestOrganizationDeletion(@Req() req: any, @Res() res: Response) {
    try {
      const result =
        await this.organizationsService.requestOrganizationDeletion(
          req.currentOrganization._id,
          req.user._id
        );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Organization deletion request submitted',
        data: result,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to request organization deletion',
      });
    }
  }

  @Post('/:organizationId/cancel-deletion')
  @UseGuards(OrganizationAccessGuard)
  @RequirePermission('delete_organization')
  async cancelOrganizationDeletion(
    @Param('organizationId') organizationId: string,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const result = await this.organizationsService.cancelOrganizationDeletion(
        new Types.ObjectId(organizationId)
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Organization deletion request cancelled',
        data: result,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to cancel organization deletion',
      });
    }
  }

  @Get('/listing')
  async getOrganizationsListing(@Req() req: any, @Res() res: Response) {
    try {
      const organizations =
        await this.organizationsService.getOrganizationsListing(req.user._id);

      return res.status(HttpStatus.OK).json({
        success: true,
        data: organizations,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch organizations',
      });
    }
  }

  @Get('/search')
  @RequirePermission('view_organization')
  async searchOrganizations(
    @Query('query') query: string,
    @Query('type') type: string,
    @Res() res: Response
  ) {
    try {
      const organizations = await this.organizationsService.searchOrganizations(
        query,
        type
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: organizations,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to search organizations',
      });
    }
  }

  @Get('/roles/:organizationId')
  @UseGuards(OrganizationAccessGuard)
  @RequirePermission('view_organization')
  async getOrganizationRoleHierarchy(
    @Param('organizationId') organizationId: string,
    @Res() res: Response
  ) {
    try {
      const roles =
        await this.organizationsService.getOrganizationRoleHierarchy(
          new Types.ObjectId(organizationId)
        );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: roles,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch role hierarchy',
      });
    }
  }

  @Post('/set-primary')
  async setPrimaryOrganization(
    @Body('organizationId') organizationId: string,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const result = await this.organizationsService.setPrimaryOrganization(
        req.user._id,
        new Types.ObjectId(organizationId)
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Primary organization updated',
        data: result,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to set primary organization',
      });
    }
  }
}

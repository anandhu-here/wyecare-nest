import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../authentication/jwt/jwt-auth.guard';
import { CreateOrganizationInvitationDto } from '../dto/create-organization-invitation.dto';
import { Response } from 'express';
import { RequirePermission } from '../../authorization/permissions.decorator';
import { OrganizationInvitationService } from '../services/organization-invitation.service';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationInvitationController {
  constructor(
    private readonly organizationInvitationService: OrganizationInvitationService
  ) {}

  @Post('/invitations/create')
  @RequirePermission('invite_organization')
  async createOrganizationInvitation(
    @Body() createInvitationDto: CreateOrganizationInvitationDto,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const result =
        await this.organizationInvitationService.createOrganizationInvitation(
          createInvitationDto,
          req.user._id,
          req.currentOrganization._id
        );

      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Organization invitation created successfully',
        data: result,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to create organization invitation',
      });
    }
  }

  @Get('/all-invitations')
  @RequirePermission('view_organization')
  async getAllInvitations(@Req() req: any, @Res() res: Response) {
    try {
      const invitations =
        await this.organizationInvitationService.getAllInvitations(
          req.currentOrganization._id
        );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: invitations,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch all invitations',
      });
    }
  }

  @Get('/invitations/validate/:invToken')
  @RequirePermission('invite_organization')
  async validateInvitationToken(
    @Param('invToken') invToken: string,
    @Res() res: Response
  ) {
    try {
      const validationResult =
        await this.organizationInvitationService.validateInvitationToken(
          invToken
        );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: validationResult,
      });
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Invalid invitation token',
      });
    }
  }

  @Post('/invitations/accept/:invToken')
  @RequirePermission('invite_organization')
  async acceptInvitation(
    @Param('invToken') invToken: string,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const result = await this.organizationInvitationService.acceptInvitation(
        invToken,
        req.user._id
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Invitation accepted successfully',
        data: result,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to accept invitation',
      });
    }
  }
}

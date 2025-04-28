import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../../authentication/jwt/jwt-auth.guard';
import { RequirePermission } from '../../authorization/permissions.decorator';
import { LinkOrganizationsDto } from '../dto/link-organizations.dto';
import { UnlinkOrganizationsDto } from '../dto/unlink-organizations.dto';
import { CreateLinkInvitationDto } from '../dto/create-link-invitation.dto';
import { RespondToLinkInvitationDto } from '../dto/respond-to-link-invitation.dto';
import { OrganizationLinkingService } from '../services/organization-linking.service';
import { Auth } from '../../authorization/auth.decorator';
import {
  AcceptLinkDto,
  CreateLinkTokenDto,
  VerifyLinkTokenDto,
} from '../dto/token-link.dto';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationLinkingController {
  constructor(
    private readonly organizationLinkingService: OrganizationLinkingService
  ) {}

  @Post('/link')
  @RequirePermission('link_organizations')
  async linkOrganizations(
    @Body() linkOrganizationsDto: LinkOrganizationsDto,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const result = await this.organizationLinkingService.linkOrganizations(
        linkOrganizationsDto,
        req.user._id
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Organizations linked successfully',
        data: result,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to link organizations',
      });
    }
  }

  @Post('/unlink')
  @RequirePermission('link_organizations')
  async unlinkOrganizations(
    @Body() unlinkOrganizationsDto: UnlinkOrganizationsDto,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const result = await this.organizationLinkingService.unlinkOrganizations(
        unlinkOrganizationsDto,
        req.user._id
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Organizations unlinked successfully',
        data: result,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to unlink organizations',
      });
    }
  }

  @Post('/send-link-invitation')
  @Auth('link_organizations')
  async sendLinkInvitation(
    @Body()
    sendLinkInvitationDto: {
      targetOrganizationId: string;
      token: string;
      message?: string;
    },
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      await this.organizationLinkingService.sendLinkInvitation(
        req.currentOrganization._id,
        new Types.ObjectId(sendLinkInvitationDto.targetOrganizationId),
        sendLinkInvitationDto.token,
        sendLinkInvitationDto.message
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Link invitation sent successfully',
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to send link invitation',
      });
    }
  }

  @Get('/linked')
  @Auth('view_organization')
  async getLinkedOrganizations(@Req() req: any, @Res() res: Response) {
    try {
      const organizations =
        await this.organizationLinkingService.getLinkedOrganizations(
          req.currentOrganization._id
        );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: organizations,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch linked organizations',
      });
    }
  }

  @Get('/linked/paginated')
  @Auth('view_organization')
  async getLinkedOrganizationsPaginated(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('type') type: string,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const result =
        await this.organizationLinkingService.getLinkedOrganizationsPaginated(
          req.currentOrganization._id,
          page,
          limit,
          type
        );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch linked organizations',
      });
    }
  }

  @Get('/linked/:organizationId')
  @RequirePermission('view_organization')
  async getLinkedOrganizationById(
    @Param('organizationId') organizationId: string,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const organization =
        await this.organizationLinkingService.getLinkedOrganizationById(
          req.currentOrganization._id,
          new Types.ObjectId(organizationId)
        );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: organization,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch linked organization',
      });
    }
  }

  @Get('/linked-admins')
  async getLinkedOrganizationAdmin(@Req() req: any, @Res() res: Response) {
    try {
      const admins =
        await this.organizationLinkingService.getLinkedOrganizationAdmin(
          req.currentOrganization._id
        );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: admins,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch linked organization admins',
      });
    }
  }

  @Get('/linked-admins/carer')
  async getLinkedOrganizationAdminForCarer(
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const admins =
        await this.organizationLinkingService.getLinkedOrganizationAdminForCarer(
          req.currentOrganization._id,
          req.user._id
        );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: admins,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message:
          error.message ||
          'Failed to fetch linked organization admins for carer',
      });
    }
  }

  @Post('/link-token')
  @Auth('link_organizations')
  async createLinkToken(
    @Body() createLinkTokenDto: CreateLinkTokenDto,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const result = await this.organizationLinkingService.createLinkToken(
        {
          ...createLinkTokenDto,
          sourceOrganizationId: req.currentOrganization._id,
        },
        req.user._id
      );

      // Create the frontend URL that can be shared
      const baseUrl = process.env['FRONTEND_URL'] || 'https://yourdomain.com';
      const linkUrl = `${baseUrl}/organizations/link?token=${result.token}`;

      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Link token created successfully',
        data: {
          ...result,
          linkUrl,
        },
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to create link token',
      });
    }
  }
  @Get('/find-by-email')
  @Auth('link_organizations')
  async findOrganizationsByEmail(
    @Query('email') email: string,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      // Prevent searching for own organization
      const currentOrgId = req.currentOrganization._id;

      const organizations =
        await this.organizationLinkingService.findOrganizationsByEmail(
          email,
          currentOrgId // Pass current org ID to prevent returning it in results
        );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: organizations,
      });
    } catch (error: any) {
      console.log('Error finding organizations by email:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to find organizations',
      });
    }
  }

  /**
   * Verify a link token without accepting it
   */
  @Post('/verify-link-token')
  @UseGuards(JwtAuthGuard)
  async verifyLinkToken(
    @Body() verifyLinkTokenDto: VerifyLinkTokenDto,
    @Res() res: Response
  ) {
    try {
      const result = await this.organizationLinkingService.verifyLinkToken(
        verifyLinkTokenDto
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Link token verified successfully',
        data: result,
      });
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Invalid link token',
      });
    }
  }

  /**
   * Accept a link using a token
   */
  @Post('/accept-link-token')
  @Auth('link_organizations')
  async acceptLink(
    @Body() acceptLinkDto: AcceptLinkDto,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const result = await this.organizationLinkingService.acceptLink(
        {
          ...acceptLinkDto,
          targetOrganizationId: req.currentOrganization._id,
        },
        req.user._id
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Organizations linked successfully',
        data: result,
      });
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to link organizations',
      });
    }
  }
  // Link Invitation Endpoints
  @Post('/linkInvitation')
  @Auth('link_organizations')
  async createLinkInvitation(
    @Body() createLinkInvitationDto: CreateLinkInvitationDto,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const result = await this.organizationLinkingService.createLinkInvitation(
        createLinkInvitationDto,
        req.user._id,
        req.currentOrganization._id
      );

      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Link invitation created successfully',
        data: result,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to create link invitation',
      });
    }
  }

  @Get('/linkInvitations')
  @RequirePermission('view_organization')
  async getLinkInvitations(@Req() req: any, @Res() res: Response) {
    try {
      const invitations =
        await this.organizationLinkingService.getLinkInvitations(
          req.currentOrganization._id
        );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: invitations,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch link invitations',
      });
    }
  }

  @Delete('/linkInvitations/:invitationId')
  async deleteLinkInvitation(
    @Param('invitationId') invitationId: string,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const result = await this.organizationLinkingService.deleteLinkInvitation(
        new Types.ObjectId(invitationId),
        req.user._id
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Link invitation deleted successfully',
        data: result,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to delete link invitation',
      });
    }
  }

  @Post('/respondToLinkInvitation')
  @RequirePermission('link_organizations')
  async respondToLinkInvitation(
    @Body() respondToInvitationDto: RespondToLinkInvitationDto,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const result =
        await this.organizationLinkingService.respondToLinkInvitation(
          respondToInvitationDto,
          req.user._id,
          req.currentOrganization._id
        );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: `Link invitation ${
          respondToInvitationDto.accept ? 'accepted' : 'rejected'
        } successfully`,
        data: result,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to respond to link invitation',
      });
    }
  }
}

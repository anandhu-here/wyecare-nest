// super-admin/controllers/organization-invitation.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../authentication/jwt/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { OrganizationInvitationService } from '../services/organization-invitation.service';
import { CreateOrgInvitationDto } from '../dto/create-org-invitation.dto';
import { Types } from 'mongoose';

@Controller('super-admin/organization-invitations')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class OrganizationInvitationController {
  constructor(
    private readonly invitationService: OrganizationInvitationService
  ) {}

  @Post()
  async createInvitation(
    @Body(ValidationPipe) createInvitationDto: CreateOrgInvitationDto,
    @Req() req: any
  ) {
    return this.invitationService.createInvitation(
      createInvitationDto,
      new Types.ObjectId(req.user._id)
    );
  }

  @Get()
  async getInvitations(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: string
  ) {
    return this.invitationService.getInvitations(+page, +limit, status);
  }

  @Delete(':id')
  async cancelInvitation(@Param('id') id: string) {
    return this.invitationService.cancelInvitation(new Types.ObjectId(id));
  }

  @Post(':id/resend')
  async resendInvitation(@Param('id') id: string) {
    return this.invitationService.resendInvitation(new Types.ObjectId(id));
  }
}

// app/auth/controllers/invitations.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  Request,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { InvitationsService } from '../services/invitations.service';
import { CreateInvitationDto } from '../dto/create-invitation.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PoliciesGuard } from '../../casl/guards/policies.guard';
import { CheckPolicies } from '../../casl/decorators/check-policies.decorator';
import { Action } from '../../casl/enums/actions.enums';
import { InvitationClass } from '../../casl/entities';

@ApiTags('auth/invitations')
@Controller('auth/invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.CREATE, InvitationClass))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new invitation' })
  @ApiResponse({
    status: 201,
    description: 'The invitation has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  @ApiResponse({ status: 409, description: 'Conflict.' })
  create(@Body() createInvitationDto: CreateInvitationDto, @Request() req) {
    return this.invitationsService.create(createInvitationDto, req.user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.READ, InvitationClass))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all invitations' })
  @ApiResponse({ status: 200, description: 'Return all invitations.' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('status') status?: string,
    @Request() req?
  ) {
    const where = {
      ...(status && { status }),
    };

    return this.invitationsService.findAll({
      skip: skip ? +skip : 0,
      take: take ? +take : 10,
      where,
      orderBy: { createdAt: 'desc' },
      currentUser: req.user,
    });
  }

  @Get('validate/:token')
  @ApiOperation({ summary: 'Validate invitation token' })
  @ApiResponse({ status: 200, description: 'Return the invitation.' })
  @ApiResponse({ status: 404, description: 'Invitation not found.' })
  @ApiResponse({ status: 400, description: 'Invitation expired or used.' })
  validateToken(@Param('token') token: string) {
    return this.invitationsService.findByToken(token);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.READ, InvitationClass))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get invitation by ID' })
  @ApiResponse({ status: 200, description: 'Return the invitation.' })
  @ApiResponse({ status: 404, description: 'Invitation not found.' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.invitationsService.findOne(id, req.user);
  }

  @Patch(':id/revoke')
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.UPDATE, InvitationClass))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke invitation by ID' })
  @ApiResponse({
    status: 200,
    description: 'The invitation has been successfully revoked.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Invitation not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  revoke(@Param('id') id: string, @Request() req) {
    return this.invitationsService.revoke(id, req.user);
  }

  @Patch(':id/resend')
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.UPDATE, InvitationClass))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend invitation by ID' })
  @ApiResponse({
    status: 200,
    description: 'The invitation has been successfully resent.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Invitation not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  resend(@Param('id') id: string, @Request() req) {
    return this.invitationsService.resend(id, req.user);
  }
}

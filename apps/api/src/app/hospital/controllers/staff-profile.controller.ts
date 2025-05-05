// app/hospital/controllers/staff-profiles.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { StaffProfilesService } from '../services/staff-profiles.service';
import { CreateStaffProfileDto } from '../dto/create-staff-profile.dto';
import { UpdateStaffProfileDto } from '../dto/update-staff-profile.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../casl/guards/policies.guard';
import { CheckPolicies } from '../../casl/decorators/check-policies.decorator';
import { Action } from '../../casl/enums/actions.enums';
import { CreateCompensationRateDto } from '../dto/create-compensation-rate.dto';
import { StaffType, StaffStatus } from '@prisma/client';
import { StaffProfile } from '../../casl/entities';

@ApiTags('hospital/staff-profiles')
@Controller('hospital/staff-profiles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StaffProfilesController {
  constructor(private readonly staffProfilesService: StaffProfilesService) {}

  @Post()
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.CREATE, StaffProfile))
  @ApiOperation({ summary: 'Create a new staff profile' })
  @ApiResponse({
    status: 201,
    description: 'The staff profile has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Staff profile already exists.',
  })
  create(@Body() createStaffProfileDto: CreateStaffProfileDto, @Request() req) {
    return this.staffProfilesService.create(createStaffProfileDto, req.user);
  }

  @Get()
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.READ, StaffProfile))
  @ApiOperation({ summary: 'Get all staff profiles' })
  @ApiResponse({ status: 200, description: 'Return all staff profiles.' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'staffType', required: false, enum: StaffType })
  @ApiQuery({ name: 'specialty', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: StaffStatus })
  findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('staffType') staffType?: StaffType,
    @Query('specialty') specialty?: string,
    @Query('status') status?: StaffStatus,
    @Request() req?
  ) {
    const where: any = {
      ...(staffType && { staffType }),
      ...(specialty && {
        specialty: { contains: specialty, mode: 'insensitive' },
      }),
      ...(status && { status }),
    };

    return this.staffProfilesService.findAll({
      skip: skip ? +skip : 0,
      take: take ? +take : 10,
      where,
      orderBy: { dateJoined: 'desc' },
      currentUser: req.user,
    });
  }

  @Get(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.READ, StaffProfile))
  @ApiOperation({ summary: 'Get staff profile by ID' })
  @ApiResponse({ status: 200, description: 'Return the staff profile.' })
  @ApiResponse({ status: 404, description: 'Staff profile not found.' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.staffProfilesService.findOne(id, req.user);
  }

  @Patch(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.UPDATE, StaffProfile))
  @ApiOperation({ summary: 'Update staff profile by ID' })
  @ApiResponse({
    status: 200,
    description: 'The staff profile has been successfully updated.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Staff profile not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  update(
    @Param('id') id: string,
    @Body() updateStaffProfileDto: UpdateStaffProfileDto,
    @Request() req
  ) {
    return this.staffProfilesService.update(
      id,
      updateStaffProfileDto,
      req.user
    );
  }

  @Post(':id/compensation-rates')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.UPDATE, StaffProfile))
  @ApiOperation({ summary: 'Add a compensation rate to a staff profile' })
  @ApiResponse({
    status: 200,
    description: 'The compensation rate has been successfully added.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({
    status: 404,
    description: 'Staff profile or department not found.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Compensation rate already exists.',
  })
  addCompensationRate(
    @Param('id') id: string,
    @Body() createCompensationRateDto: CreateCompensationRateDto,
    @Request() req
  ) {
    return this.staffProfilesService.addCompensationRate(
      id,
      createCompensationRateDto,
      req.user
    );
  }

  @Delete(':id/compensation-rates/:rateId')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.UPDATE, StaffProfile))
  @ApiOperation({ summary: 'Remove a compensation rate from a staff profile' })
  @ApiResponse({
    status: 200,
    description: 'The compensation rate has been successfully removed.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({
    status: 404,
    description: 'Staff profile or compensation rate not found.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  removeCompensationRate(
    @Param('id') id: string,
    @Param('rateId') rateId: string,
    @Request() req
  ) {
    return this.staffProfilesService.removeCompensationRate(
      id,
      rateId,
      req.user
    );
  }

  @Delete(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.DELETE, StaffProfile))
  @ApiOperation({ summary: 'Delete staff profile by ID' })
  @ApiResponse({
    status: 200,
    description: 'The staff profile has been successfully deleted.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Staff profile not found.' })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Cannot delete staff profile with shifts or payments.',
  })
  remove(@Param('id') id: string, @Request() req) {
    return this.staffProfilesService.remove(id, req.user);
  }
}

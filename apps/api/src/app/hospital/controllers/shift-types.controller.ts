// app/hospital/controllers/shift-types.controller.ts

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
import { ShiftTypesService } from '../services/shift-types.service';
import { CreateShiftTypeDto } from '../dto/create-shift-type.dto';
import { UpdateShiftTypeDto } from '../dto/update-shift-type.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../casl/guards/policies.guard';
import { CheckPolicies } from '../../casl/decorators/check-policies.decorator';
import { Action } from '../../casl/enums/actions.enums';
import { ShiftType } from '../../casl/entities';

@ApiTags('hospital/shift-types')
@Controller('hospital/shift-types')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShiftTypesController {
  constructor(private readonly shiftTypesService: ShiftTypesService) {}

  @Post()
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.CREATE, ShiftType))
  @ApiOperation({ summary: 'Create a new shift type' })
  @ApiResponse({
    status: 201,
    description: 'The shift type has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Shift type already exists.',
  })
  create(@Body() createShiftTypeDto: CreateShiftTypeDto, @Request() req) {
    return this.shiftTypesService.create(createShiftTypeDto, req.user);
  }

  @Get()
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.READ, ShiftType))
  @ApiOperation({ summary: 'Get all shift types' })
  @ApiResponse({ status: 200, description: 'Return all shift types.' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'organizationId', required: false, type: String })
  findAll(
    @Request() req: any,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('name') name?: string,
    @Query('organizationId') organizationId?: string
  ) {
    const where: any = {
      ...(name && { name: { contains: name, mode: 'insensitive' } }),
      ...(organizationId && { organizationId }),
    };

    return this.shiftTypesService.findAll({
      skip: skip ? +skip : 0,
      take: take ? +take : 10,
      where,
      orderBy: { name: 'asc' },
      currentUser: req.user,
    });
  }

  @Get(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.READ, ShiftType))
  @ApiOperation({ summary: 'Get shift type by ID' })
  @ApiResponse({ status: 200, description: 'Return the shift type.' })
  @ApiResponse({ status: 404, description: 'Shift type not found.' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.shiftTypesService.findOne(id, req.user);
  }

  @Patch(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.UPDATE, ShiftType))
  @ApiOperation({ summary: 'Update shift type by ID' })
  @ApiResponse({
    status: 200,
    description: 'The shift type has been successfully updated.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Shift type not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Shift type already exists.',
  })
  update(
    @Param('id') id: string,
    @Body() updateShiftTypeDto: UpdateShiftTypeDto,
    @Request() req
  ) {
    return this.shiftTypesService.update(id, updateShiftTypeDto, req.user);
  }

  @Delete(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.DELETE, ShiftType))
  @ApiOperation({ summary: 'Delete shift type by ID' })
  @ApiResponse({
    status: 200,
    description: 'The shift type has been successfully deleted.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Shift type not found.' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Cannot delete shift type in use.',
  })
  remove(@Param('id') id: string, @Request() req) {
    return this.shiftTypesService.remove(id, req.user);
  }
}

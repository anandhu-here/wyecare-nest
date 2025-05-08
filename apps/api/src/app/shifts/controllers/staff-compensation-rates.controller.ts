// staff-compensation-rates.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CreateStaffCompensationRateDto,
  UpdateStaffCompensationRateDto,
  FindStaffCompensationRateDto,
  PaymentType,
} from '../dto/staff-compensation-rate.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StaffCompensationRatesService } from '../services/staff-compensation-rates.service';

@ApiTags('Staff Compensation Rates')
@Controller('api/staff-compensation-rates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StaffCompensationRatesController {
  constructor(private readonly service: StaffCompensationRatesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new staff compensation rate',
    description:
      'Creates a new base compensation rate for a staff member in a specific department',
  })
  @ApiBody({ type: CreateStaffCompensationRateDto })
  @ApiCreatedResponse({
    description: 'The compensation rate has been successfully created.',
    type: Object,
  })
  create(@Body() createDto: CreateStaffCompensationRateDto) {
    return this.service.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Find all compensation rates',
    description: 'Retrieves all compensation rates with optional filtering',
  })
  @ApiQuery({ name: 'staffProfileId', required: false, type: String })
  @ApiQuery({ name: 'departmentId', required: false, type: String })
  @ApiQuery({ name: 'paymentType', required: false, enum: PaymentType })
  @ApiQuery({ name: 'effectiveDate', required: false, type: Date })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'includePremiums', required: false, type: Boolean })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiOkResponse({
    description: 'Returns all compensation rates that match the query.',
    type: [Object],
  })
  findAll(@Query() query: FindStaffCompensationRateDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Find one compensation rate by ID',
    description:
      'Retrieves a specific compensation rate by its unique identifier',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The compensation rate ID',
  })
  @ApiQuery({
    name: 'includePremiums',
    required: false,
    type: Boolean,
    description: 'Include shift premiums in the response',
  })
  @ApiOkResponse({
    description: 'Returns the compensation rate with the given ID.',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Compensation rate not found.' })
  findOne(
    @Param('id') id: string,
    @Query('includePremiums') includePremiums?: boolean
  ) {
    return this.service.findOne(id, includePremiums);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a compensation rate',
    description: 'Updates an existing compensation rate with the provided data',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The compensation rate ID',
  })
  @ApiBody({ type: UpdateStaffCompensationRateDto })
  @ApiOkResponse({
    description: 'The compensation rate has been successfully updated.',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Compensation rate not found.' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateStaffCompensationRateDto
  ) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a compensation rate',
    description: 'Removes a compensation rate from the system',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The compensation rate ID',
  })
  @ApiOkResponse({
    description: 'The compensation rate has been successfully deleted.',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Compensation rate not found.' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get('staff/:staffProfileId/department/:departmentId')
  @ApiOperation({
    summary:
      'Find current compensation rate for a staff member in a department',
    description:
      'Returns the currently effective compensation rate for a specific staff member in a specific department',
  })
  @ApiParam({
    name: 'staffProfileId',
    type: String,
    description: 'The staff profile ID',
  })
  @ApiParam({
    name: 'departmentId',
    type: String,
    description: 'The department ID',
  })
  @ApiOkResponse({
    description: 'Returns the current effective compensation rate.',
    type: Object,
  })
  @ApiResponse({
    status: 404,
    description: 'No active compensation rate found.',
  })
  findCurrentRate(
    @Param('staffProfileId') staffProfileId: string,
    @Param('departmentId') departmentId: string
  ) {
    return this.service.findCurrentRate(staffProfileId, departmentId);
  }

  @Get('calculate-pay')
  @ApiOperation({
    summary: 'Calculate pay for a shift',
    description:
      'Calculates the payment for a staff member working a specific shift type for a given number of hours',
  })
  @ApiQuery({ name: 'staffProfileId', required: true, type: String })
  @ApiQuery({ name: 'departmentId', required: true, type: String })
  @ApiQuery({ name: 'shiftTypeId', required: true, type: String })
  @ApiQuery({ name: 'hoursWorked', required: true, type: Number })
  @ApiOkResponse({
    description: 'Returns the calculated payment details.',
    type: Object,
  })
  @ApiResponse({
    status: 404,
    description: 'Staff, department, or shift type not found.',
  })
  calculateShiftPay(
    @Query('staffProfileId') staffProfileId: string,
    @Query('departmentId') departmentId: string,
    @Query('shiftTypeId') shiftTypeId: string,
    @Query('hoursWorked') hoursWorked: number
  ) {
    return this.service.calculateShiftPay(
      staffProfileId,
      departmentId,
      shiftTypeId,
      Number(hoursWorked)
    );
  }
}

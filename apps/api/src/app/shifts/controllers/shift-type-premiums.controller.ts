// shift-type-premiums.controller.ts

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
  CreateShiftTypePremiumDto,
  UpdateShiftTypePremiumDto,
  FindShiftTypePremiumDto,
} from '../dto/shift-type-premium.dto';
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
import { ShiftTypePremiumsService } from '../services/shift-type-premiums.service';

@ApiTags('Shift Type Premiums')
@Controller('api/shift-type-premiums')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShiftTypePremiumsController {
  constructor(private readonly service: ShiftTypePremiumsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new shift type premium',
    description:
      'Creates a premium payment rule for a specific shift type and compensation rate',
  })
  @ApiBody({ type: CreateShiftTypePremiumDto })
  @ApiCreatedResponse({
    description: 'The shift premium has been successfully created.',
    type: Object,
  })
  create(@Body() createDto: CreateShiftTypePremiumDto) {
    return this.service.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Find all shift premiums',
    description: 'Retrieves all shift type premiums with optional filtering',
  })
  @ApiQuery({ name: 'shiftTypeId', required: false, type: String })
  @ApiQuery({ name: 'compensationRateId', required: false, type: String })
  @ApiQuery({ name: 'effectiveDate', required: false, type: Date })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiOkResponse({
    description: 'Returns all shift premiums that match the query.',
    type: [Object],
  })
  findAll(@Query() query: FindShiftTypePremiumDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Find one shift premium by ID',
    description: 'Retrieves a specific shift premium by its unique identifier',
  })
  @ApiParam({ name: 'id', type: String, description: 'The shift premium ID' })
  @ApiOkResponse({
    description: 'Returns the shift premium with the given ID.',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Shift premium not found.' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a shift premium',
    description: 'Updates an existing shift premium with the provided data',
  })
  @ApiParam({ name: 'id', type: String, description: 'The shift premium ID' })
  @ApiBody({ type: UpdateShiftTypePremiumDto })
  @ApiOkResponse({
    description: 'The shift premium has been successfully updated.',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Shift premium not found.' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateShiftTypePremiumDto
  ) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a shift premium',
    description: 'Removes a shift premium from the system',
  })
  @ApiParam({ name: 'id', type: String, description: 'The shift premium ID' })
  @ApiOkResponse({
    description: 'The shift premium has been successfully deleted.',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Shift premium not found.' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get('applicable/:staffProfileId/:departmentId/:shiftTypeId')
  @ApiOperation({
    summary: 'Find applicable premiums',
    description:
      'Finds all applicable premiums for a staff member working a specific shift type in a department',
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
  @ApiParam({
    name: 'shiftTypeId',
    type: String,
    description: 'The shift type ID',
  })
  @ApiOkResponse({
    description: 'Returns all applicable shift premiums.',
    type: [Object],
  })
  findApplicablePremiums(
    @Param('staffProfileId') staffProfileId: string,
    @Param('departmentId') departmentId: string,
    @Param('shiftTypeId') shiftTypeId: string
  ) {
    return this.service.findApplicablePremiums(
      staffProfileId,
      departmentId,
      shiftTypeId
    );
  }
}

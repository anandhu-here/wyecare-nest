// payment-rules.controller.ts

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
  CreatePaymentRuleDto,
  UpdatePaymentRuleDto,
  FindPaymentRuleDto,
  PaymentRuleResponseDto,
  PaymentType,
} from '../dto/payment-rule.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PaymentRulesService } from '../services/payment-rules.service';
@ApiTags('Payment Rules')
@Controller('api/payment-rules')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentRulesController {
  constructor(private readonly paymentRulesService: PaymentRulesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new payment rule',
    description:
      'Creates a new payment rule that defines payment rates for a specific role and shift type combination',
  })
  @ApiBody({ type: CreatePaymentRuleDto })
  @ApiCreatedResponse({
    description: 'The payment rule has been successfully created.',
    type: PaymentRuleResponseDto,
  })
  create(@Body() createPaymentRuleDto: CreatePaymentRuleDto) {
    return this.paymentRulesService.create(createPaymentRuleDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Find all payment rules',
    description: 'Retrieves all payment rules with optional filtering',
  })
  @ApiQuery({ name: 'shiftTypeId', required: false, type: String })
  @ApiQuery({ name: 'roleId', required: false, type: String })
  @ApiQuery({ name: 'organizationId', required: false, type: String })
  @ApiQuery({ name: 'paymentType', required: false, enum: PaymentType })
  @ApiQuery({ name: 'effectiveDate', required: false, type: Date })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiOkResponse({
    description: 'Returns all payment rules that match the query.',
    type: [PaymentRuleResponseDto],
  })
  findAll(@Query() query: FindPaymentRuleDto) {
    return this.paymentRulesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Find one payment rule by ID',
    description: 'Retrieves a specific payment rule by its unique identifier',
  })
  @ApiParam({ name: 'id', type: String, description: 'The payment rule ID' })
  @ApiOkResponse({
    description: 'Returns the payment rule with the given ID.',
    type: PaymentRuleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Payment rule not found.' })
  findOne(@Param('id') id: string) {
    return this.paymentRulesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a payment rule',
    description: 'Updates an existing payment rule with the provided data',
  })
  @ApiParam({ name: 'id', type: String, description: 'The payment rule ID' })
  @ApiBody({ type: UpdatePaymentRuleDto })
  @ApiOkResponse({
    description: 'The payment rule has been successfully updated.',
    type: PaymentRuleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Payment rule not found.' })
  update(
    @Param('id') id: string,
    @Body() updatePaymentRuleDto: UpdatePaymentRuleDto
  ) {
    return this.paymentRulesService.update(id, updatePaymentRuleDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a payment rule',
    description: 'Removes a payment rule from the system',
  })
  @ApiParam({ name: 'id', type: String, description: 'The payment rule ID' })
  @ApiOkResponse({
    description: 'The payment rule has been successfully deleted.',
    type: PaymentRuleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Payment rule not found.' })
  remove(@Param('id') id: string) {
    return this.paymentRulesService.remove(id);
  }

  @Get('organization/:organizationId')
  @ApiOperation({
    summary: 'Find payment rules by organization',
    description: 'Retrieves all payment rules for a specific organization',
  })
  @ApiParam({
    name: 'organizationId',
    type: String,
    description: 'The organization ID',
  })
  @ApiQuery({ name: 'shiftTypeId', required: false, type: String })
  @ApiQuery({ name: 'roleId', required: false, type: String })
  @ApiQuery({ name: 'paymentType', required: false, enum: PaymentType })
  @ApiQuery({ name: 'effectiveDate', required: false, type: Date })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiOkResponse({
    description: 'Returns all payment rules for the given organization.',
    type: [PaymentRuleResponseDto],
  })
  findByOrganization(
    @Param('organizationId') organizationId: string,
    @Query() query: Omit<FindPaymentRuleDto, 'organizationId'>
  ) {
    return this.paymentRulesService.findAll({
      ...query,
      organizationId,
    });
  }

  @Get('role/:roleId')
  @ApiOperation({
    summary: 'Find payment rules by role',
    description: 'Retrieves all payment rules for a specific role',
  })
  @ApiParam({
    name: 'roleId',
    type: String,
    description: 'The role ID',
  })
  @ApiQuery({ name: 'shiftTypeId', required: false, type: String })
  @ApiQuery({ name: 'organizationId', required: false, type: String })
  @ApiQuery({ name: 'paymentType', required: false, enum: PaymentType })
  @ApiQuery({ name: 'effectiveDate', required: false, type: Date })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiOkResponse({
    description: 'Returns all payment rules for the given role.',
    type: [PaymentRuleResponseDto],
  })
  findByRole(
    @Param('roleId') roleId: string,
    @Query() query: Omit<FindPaymentRuleDto, 'roleId'>
  ) {
    return this.paymentRulesService.findAll({
      ...query,
      roleId,
    });
  }

  @Get('shift-type/:shiftTypeId')
  @ApiOperation({
    summary: 'Find payment rules by shift type',
    description: 'Retrieves all payment rules for a specific shift type',
  })
  @ApiParam({
    name: 'shiftTypeId',
    type: String,
    description: 'The shift type ID',
  })
  @ApiQuery({ name: 'roleId', required: false, type: String })
  @ApiQuery({ name: 'organizationId', required: false, type: String })
  @ApiQuery({ name: 'paymentType', required: false, enum: PaymentType })
  @ApiQuery({ name: 'effectiveDate', required: false, type: Date })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiOkResponse({
    description: 'Returns all payment rules for the given shift type.',
    type: [PaymentRuleResponseDto],
  })
  findByShiftType(
    @Param('shiftTypeId') shiftTypeId: string,
    @Query() query: Omit<FindPaymentRuleDto, 'shiftTypeId'>
  ) {
    return this.paymentRulesService.findAll({
      ...query,
      shiftTypeId,
    });
  }
}

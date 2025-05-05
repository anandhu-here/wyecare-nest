// app/hospital/controllers/staff-payments.controller.ts

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
import { StaffPaymentsService } from '../services/staff-payments.service';
import { CreateStaffPaymentDto } from '../dto/create-staff-payment.dto';
import { UpdateStaffPaymentDto } from '../dto/update-staff-payment.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../casl/guards/policies.guard';
import { CheckPolicies } from '../../casl/decorators/check-policies.decorator';
import { Action } from '../../casl/enums/actions.enums';
import { StaffPayment } from '../../casl/entities';

@ApiTags('hospital/staff-payments')
@Controller('hospital/staff-payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StaffPaymentsController {
  constructor(private readonly staffPaymentsService: StaffPaymentsService) {}

  @Post()
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.CREATE, StaffPayment))
  @ApiOperation({ summary: 'Create a new staff payment' })
  @ApiResponse({
    status: 201,
    description: 'The staff payment has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({
    status: 404,
    description: 'Staff Profile or Pay Period not found.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Payment already exists.',
  })
  create(@Body() createStaffPaymentDto: CreateStaffPaymentDto, @Request() req) {
    return this.staffPaymentsService.create(createStaffPaymentDto, req.user);
  }

  @Get()
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.READ, StaffPayment))
  @ApiOperation({ summary: 'Get all staff payments' })
  @ApiResponse({ status: 200, description: 'Return all staff payments.' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'payPeriodId', required: false, type: String })
  @ApiQuery({ name: 'staffProfileId', required: false, type: String })
  @ApiQuery({ name: 'paymentStatus', required: false, type: String })
  findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('payPeriodId') payPeriodId?: string,
    @Query('staffProfileId') staffProfileId?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Request() req?
  ) {
    const where = {
      ...(payPeriodId && { payPeriodId }),
      ...(staffProfileId && { staffProfileId }),
      ...(paymentStatus && { paymentStatus }),
    };

    return this.staffPaymentsService.findAll({
      skip: skip ? +skip : 0,
      take: take ? +take : 10,
      where,
      orderBy: { createdAt: 'desc' },
      currentUser: req.user,
    });
  }

  @Get(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.READ, StaffPayment))
  @ApiOperation({ summary: 'Get staff payment by ID' })
  @ApiResponse({ status: 200, description: 'Return the staff payment.' })
  @ApiResponse({ status: 404, description: 'Staff payment not found.' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.staffPaymentsService.findOne(id, req.user);
  }

  @Patch(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.UPDATE, StaffPayment))
  @ApiOperation({ summary: 'Update staff payment by ID' })
  @ApiResponse({
    status: 200,
    description: 'The staff payment has been successfully updated.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Staff payment not found.' })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Cannot update payment for finalized pay period.',
  })
  update(
    @Param('id') id: string,
    @Body() updateStaffPaymentDto: UpdateStaffPaymentDto,
    @Request() req
  ) {
    return this.staffPaymentsService.update(
      id,
      updateStaffPaymentDto,
      req.user
    );
  }

  @Delete(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.DELETE, StaffPayment))
  @ApiOperation({ summary: 'Delete staff payment by ID' })
  @ApiResponse({
    status: 200,
    description: 'The staff payment has been successfully deleted.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Staff payment not found.' })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Cannot delete payment for finalized pay period.',
  })
  remove(@Param('id') id: string, @Request() req) {
    return this.staffPaymentsService.remove(id, req.user);
  }
}

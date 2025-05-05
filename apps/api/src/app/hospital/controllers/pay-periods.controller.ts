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
import { PayPeriodsService } from '../services/pay-periods.service';
import { CreatePayPeriodDto } from '../dto/create-pay-period.dto';
import { UpdatePayPeriodDto } from '../dto/update-pay-period.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../casl/guards/policies.guard';
import { CheckPolicies } from '../../casl/decorators/check-policies.decorator';
import { Action } from '../../casl/enums/actions.enums';
import { PayPeriod } from '../../casl/entities';
@ApiTags('hospital/pay-periods')
@Controller('hospital/pay-periods')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PayPeriodsController {
  constructor(private readonly payPeriodsService: PayPeriodsService) {}
  @Post()
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.CREATE, PayPeriod))
  @ApiOperation({ summary: 'Create a new pay period' })
  @ApiResponse({
    status: 201,
    description: 'The pay period has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'Organization not found.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Pay period already exists or overlaps.',
  })
  create(@Body() createPayPeriodDto: CreatePayPeriodDto, @Request() req) {
    return this.payPeriodsService.create(createPayPeriodDto, req.user);
  }
  @Get()
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.READ, PayPeriod))
  @ApiOperation({ summary: 'Get all pay periods' })
  @ApiResponse({ status: 200, description: 'Return all pay periods.' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('status') status?: string,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
    @Request() req?
  ) {
    const where = {
      ...(status && { status }),
      ...(startDate && { startDate: { gte: new Date(startDate) } }),
      ...(endDate && { endDate: { lte: new Date(endDate) } }),
    };
    return this.payPeriodsService.findAll({
      skip: skip ? +skip : 0,
      take: take ? +take : 10,
      where,
      orderBy: { startDate: 'desc' },
      currentUser: req.user,
    });
  }
  @Get(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.READ, PayPeriod))
  @ApiOperation({ summary: 'Get pay period by ID' })
  @ApiResponse({ status: 200, description: 'Return the pay period.' })
  @ApiResponse({ status: 404, description: 'Pay period not found.' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.payPeriodsService.findOne(id, req.user);
  }
  @Patch(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.UPDATE, PayPeriod))
  @ApiOperation({ summary: 'Update pay period by ID' })
  @ApiResponse({
    status: 200,
    description: 'The pay period has been successfully updated.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Pay period not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Pay period overlaps with another.',
  })
  update(
    @Param('id') id: string,
    @Body() updatePayPeriodDto: UpdatePayPeriodDto,
    @Request() req
  ) {
    return this.payPeriodsService.update(id, updatePayPeriodDto, req.user);
  }
  @Delete(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.DELETE, PayPeriod))
  @ApiOperation({ summary: 'Delete pay period by ID' })
  @ApiResponse({
    status: 200,
    description: 'The pay period has been successfully deleted.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Pay period not found.' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Cannot delete pay period with payments.',
  })
  remove(@Param('id') id: string, @Request() req) {
    return this.payPeriodsService.remove(id, req.user);
  }
}

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
import { ShiftTypesService } from '../services/shift-types.service';
import { CreateShiftTypeDto } from '../dto/create-shift-type.dto';
import { UpdateShiftTypeDto } from '../dto/update-shift-type.dto';
import { FindShiftTypeDto } from '../dto/find-shift-type.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../casl/guards/policies.guard';
import { CheckPolicies } from '../../casl/decorators/check-policies.decorator';
import { Action } from '../../casl/enums/actions.enums';
import { ShiftType } from '../../casl/entities';

@Controller('shift-types')
@UseGuards(JwtAuthGuard)
export class ShiftTypesController {
  constructor(private readonly shiftTypesService: ShiftTypesService) {}

  @Post()
  @UseGuards(PoliciesGuard)
  @CheckPolicies((action) => action.can(Action.CREATE, ShiftType))
  create(@Body() createShiftTypeDto: CreateShiftTypeDto) {
    return this.shiftTypesService.create(createShiftTypeDto);
  }

  @Get()
  @UseGuards(PoliciesGuard)
  @CheckPolicies((action) => action.can(Action.READ, ShiftType))
  findAll(@Query() query: FindShiftTypeDto) {
    return this.shiftTypesService.findAll(query);
  }

  @Get(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((action) => action.can(Action.READ, ShiftType))
  findOne(@Param('id') id: string) {
    return this.shiftTypesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((action) => action.can(Action.UPDATE, ShiftType))
  update(
    @Param('id') id: string,
    @Body() updateShiftTypeDto: UpdateShiftTypeDto
  ) {
    return this.shiftTypesService.update(id, updateShiftTypeDto);
  }

  @Delete(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((action) => action.can(Action.DELETE, ShiftType))
  remove(@Param('id') id: string) {
    return this.shiftTypesService.remove(id);
  }

  @Post(':id/clone')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((action) => action.can(Action.CREATE, ShiftType))
  cloneShiftType(
    @Param('id') id: string,
    @Body() updateData: Partial<UpdateShiftTypeDto>
  ) {
    return this.shiftTypesService.cloneShiftType(id, updateData);
  }

  @Get('organization/:organizationId')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((action) => action.can(Action.READ, ShiftType))
  findByOrganization(@Param('organizationId') organizationId: string) {
    return this.shiftTypesService.findByOrganization(organizationId);
  }
}

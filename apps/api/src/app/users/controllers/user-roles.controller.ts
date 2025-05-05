// app/users/controllers/user-roles.controller.ts

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserRolesService } from '../services/user-roles.service';
import { AssignRoleDto } from '../dto/assign-role.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../casl/guards/policies.guard';
import { CheckPolicies } from '../../casl/decorators/check-policies.decorator';
import { Action } from '../../casl/enums/actions.enums';
import { User } from '../../casl/entities';

@ApiTags('users/roles')
@Controller('users/roles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserRolesController {
  constructor(private readonly userRolesService: UserRolesService) {}

  @Post(':userId')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.UPDATE, User))
  @ApiOperation({ summary: 'Assign a role to a user' })
  @ApiResponse({
    status: 200,
    description: 'The role has been successfully assigned.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'User or Role not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - User already has this role.',
  })
  assignRole(
    @Param('userId') userId: string,
    @Body() assignRoleDto: AssignRoleDto,
    @Request() req
  ) {
    return this.userRolesService.assignRole(userId, assignRoleDto, req.user);
  }

  @Delete(':userId/:roleId')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.UPDATE, User))
  @ApiOperation({ summary: 'Remove a role from a user' })
  @ApiResponse({
    status: 200,
    description: 'The role has been successfully removed.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'User or Role not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  removeRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @Request() req
  ) {
    return this.userRolesService.removeRole(userId, roleId, req.user);
  }

  @Get('users-by-role/:roleId')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.READ, User))
  @ApiOperation({ summary: 'Get all users with a specific role' })
  @ApiResponse({
    status: 200,
    description: 'Returns all users with the specified role.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  findUsersByRole(@Param('roleId') roleId: string, @Request() req) {
    return this.userRolesService.findUsersByRole(roleId, req.user);
  }

  @Get(':userId')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.READ, User))
  @ApiOperation({ summary: 'Get all roles for a user' })
  @ApiResponse({
    status: 200,
    description: 'Returns all roles for the specified user.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  findRolesByUser(@Param('userId') userId: string, @Request() req) {
    return this.userRolesService.findRolesByUser(userId, req.user);
  }
}

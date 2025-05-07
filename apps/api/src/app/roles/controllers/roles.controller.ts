// app/roles/controllers/roles.controller.ts

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
  HttpStatus,
  HttpCode,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { RolesService } from '../services/roles.service';
import { CreateRolesDto } from '../dto/create-roles.dto';
import { UpdateRolesDto } from '../dto/update-roles.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../casl/guards/policies.guard';
import { CheckPolicies } from '../../casl/decorators/check-policies.decorator';
import { Action } from '../../casl/enums/actions.enums';
import { Permission, Role } from '../../casl/entities';
import { AssignPermissionDto } from '../dto/assign-permission.dto';
import { OrgCategory } from '@prisma/client';

@ApiTags('roles')
@Controller('roles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.CREATE, Role))
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({
    status: 201,
    description: 'The role has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 409, description: 'Conflict - Role already exists.' })
  create(@Body() createRolesDto: CreateRolesDto, @Request() req) {
    return this.rolesService.create(createRolesDto, req.user);
  }

  @Get()
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.READ, Role))
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'Return all roles.' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'isSystemRole', required: false, type: Boolean })
  @ApiQuery({ name: 'sector', required: false, enum: OrgCategory })
  @ApiQuery({ name: 'organizationId', required: false, type: String })
  findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('name') name?: string,
    @Query('isSystemRole') isSystemRole?: boolean,
    @Query('sector') sector?: OrgCategory,
    @Query('organizationId') organizationId?: string,
    @Request() req?
  ) {
    const parsedOrgId = organizationId === 'null' ? null : null;

    const where: any = {
      ...(name && { name: { contains: name, mode: 'insensitive' } }),
      ...(isSystemRole !== undefined && { isSystemRole }),
      ...(sector && { sector }),
      ...(parsedOrgId !== undefined && { organizationId: parsedOrgId }),
    };

    return this.rolesService.findAll({
      skip: skip ? +skip : 0,
      take: take ? +take : 10,
      where,
      orderBy: { name: 'asc' },
      currentUser: req.user,
    });
  }

  @Get('permissions')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.READ, Permission))
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({ status: 200, description: 'Return all permissions.' })
  findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Get(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.READ, Role))
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiResponse({ status: 200, description: 'Return the role.' })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.rolesService.findOne(id, req.user);
  }

  @Patch(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.UPDATE, Role))
  @ApiOperation({ summary: 'Update role by ID' })
  @ApiResponse({
    status: 200,
    description: 'The role has been successfully updated.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 409, description: 'Conflict - Role already exists.' })
  update(
    @Param('id') id: string,
    @Body() updateRolesDto: UpdateRolesDto,
    @Request() req
  ) {
    return this.rolesService.update(id, updateRolesDto, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.DELETE, Role))
  @ApiOperation({ summary: 'Delete role by ID' })
  @ApiResponse({
    status: 204,
    description: 'The role has been successfully deleted.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Cannot delete role with assigned users or system roles.',
  })
  remove(@Param('id') id: string, @Request() req) {
    return this.rolesService.remove(id, req.user);
  }

  // Permission management
  @Post(':id/permissions')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.UPDATE, Role))
  @ApiOperation({ summary: 'Assign a permission to a role' })
  @ApiResponse({
    status: 200,
    description: 'The permission has been successfully assigned.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Role or Permission not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Role already has this permission.',
  })
  assignPermission(
    @Param('id') id: string,
    @Body() assignPermissionDto: AssignPermissionDto,
    @Request() req
  ) {
    return this.rolesService.assignPermission(
      id,
      assignPermissionDto,
      req.user
    );
  }

  @Delete(':id/permissions/:permissionId')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.UPDATE, Role))
  @ApiOperation({ summary: 'Remove a permission from a role' })
  @ApiResponse({
    status: 200,
    description: 'The permission has been successfully removed.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Role or Permission not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  removePermission(
    @Param('id') id: string,
    @Param('permissionId') permissionId: string,
    @Request() req
  ) {
    return this.rolesService.removePermission(id, permissionId, req.user);
  }
}

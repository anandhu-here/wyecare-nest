// app/users/controllers/users.controller.ts

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
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../casl/guards/policies.guard';
import { CheckPolicies } from '../../casl/decorators/check-policies.decorator';
import { Action } from '../../casl/enums/actions.enums';
import { User } from '../../casl/entities';
import { AssignRoleDto } from '../dto/assign-role.dto';
import { UpdateUserDepartmentDto } from '../dto/update-user-department.dto';
import { AssignUserPermissionDto } from '../dto/assign-user-permission.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.CREATE, User))
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 409, description: 'Conflict - Email already exists.' })
  create(@Body() createUserDto: CreateUserDto, @Request() req) {
    return this.usersService.create(createUserDto, req.user);
  }

  @Get()
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.READ, User))
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users.' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'firstName', required: false, type: String })
  @ApiQuery({ name: 'lastName', required: false, type: String })
  @ApiQuery({ name: 'email', required: false, type: String })
  @ApiQuery({ name: 'organizationId', required: false, type: String })
  findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('firstName') firstName?: string,
    @Query('lastName') lastName?: string,
    @Query('email') email?: string,
    @Query('organizationId') organizationId?: string,
    @Request() req?
  ) {
    const where: any = {
      ...(firstName && {
        firstName: { contains: firstName, mode: 'insensitive' },
      }),
      ...(lastName && {
        lastName: { contains: lastName, mode: 'insensitive' },
      }),
      ...(email && { email: { contains: email, mode: 'insensitive' } }),
      ...(organizationId && { organizationId }),
    };

    return this.usersService.findAll({
      skip: skip ? +skip : 0,
      take: take ? +take : 10,
      where,
      orderBy: { firstName: 'asc' },
      currentUser: req.user,
    });
  }

  @Get(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.READ, User))
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'Return the user.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.usersService.findOne(id, req.user);
  }

  @Patch(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.UPDATE, User))
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully updated.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 409, description: 'Conflict - Email already exists.' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req
  ) {
    try {
      console.log('Updating user with ID:', id, 'by user:', req.user);
      return this.usersService.update(id, updateUserDto, req.user);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.DELETE, User))
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiResponse({
    status: 204,
    description: 'The user has been successfully deleted.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  remove(@Param('id') id: string, @Request() req) {
    return this.usersService.remove(id, req.user);
  }

  // Role management
  @Post(':id/roles')
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
    @Param('id') id: string,
    @Body() assignRoleDto: AssignRoleDto,
    @Request() req
  ) {
    return this.usersService.assignRole(id, assignRoleDto, req.user);
  }

  @Delete(':id/roles/:roleId')
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
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @Request() req
  ) {
    return this.usersService.removeRole(id, roleId, req.user);
  }

  // Department management
  @Post(':id/departments')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.UPDATE, User))
  @ApiOperation({ summary: 'Assign or update a department for a user' })
  @ApiResponse({
    status: 200,
    description: 'The department has been successfully assigned or updated.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'User or Department not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  updateDepartment(
    @Param('id') id: string,
    @Body() updateUserDepartmentDto: UpdateUserDepartmentDto,
    @Request() req
  ) {
    return this.usersService.updateDepartment(
      id,
      updateUserDepartmentDto,
      req.user
    );
  }

  @Delete(':id/departments/:departmentId')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.UPDATE, User))
  @ApiOperation({ summary: 'Remove a department from a user' })
  @ApiResponse({
    status: 200,
    description: 'The department has been successfully removed.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'User or Department not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  removeDepartment(
    @Param('id') id: string,
    @Param('departmentId') departmentId: string,
    @Request() req
  ) {
    return this.usersService.removeDepartment(id, departmentId, req.user);
  }

  //permissions
  @Get(':id/permissions')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.READ, User))
  @ApiOperation({ summary: 'Get user permissions' })
  @ApiResponse({ status: 200, description: 'Return user permissions.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  getUserPermissions(@Param('id') id: string, @Request() req) {
    return this.usersService.getUserPermissions(id, req.user);
  }

  @Post(':id/permissions')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.UPDATE, User))
  @ApiOperation({ summary: 'Assign a permission to a user' })
  @ApiResponse({
    status: 200,
    description: 'The permission has been successfully assigned.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'User or Permission not found.' })
  assignPermission(
    @Param('id') id: string,
    @Body() assignUserPermissionDto: AssignUserPermissionDto,
    @Request() req
  ) {
    return this.usersService.assignPermission(
      id,
      assignUserPermissionDto,
      req.user
    );
  }

  @Delete(':id/permissions/:permissionId')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.UPDATE, User))
  @ApiOperation({ summary: 'Remove a permission from a user' })
  @ApiResponse({
    status: 200,
    description: 'The permission has been successfully removed.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'User or Permission not found.' })
  removePermission(
    @Param('id') id: string,
    @Param('permissionId') permissionId: string,
    @Request() req
  ) {
    return this.usersService.removeUserPermission(id, permissionId, req.user);
  }
}

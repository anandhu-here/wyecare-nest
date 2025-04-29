// super-admin/controllers/permissions.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
  ValidationPipe,
  Put,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../authentication/jwt/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { Types } from 'mongoose';
import { AssignRoleDto } from '../dto/assign-role.dto';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { AssignPermissionDto } from '../dto/assign-permission.dto';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { SuperAdminPermissionsService } from '../services/super-admin-permissions.service';

@Controller('super-admin/permissions')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class SuperAdminPermissionsController {
  constructor(
    private readonly permissionsService: SuperAdminPermissionsService
  ) {}

  // Permission endpoints
  @Get('permissions')
  async getAllPermissions(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('category') category?: string,
    @Query('contextType') contextType?: 'SYSTEM' | 'ORGANIZATION'
  ) {
    return this.permissionsService.getAllPermissions(
      +page,
      +limit,
      category,
      contextType
    );
  }

  @Get('permissions/:id')
  async getPermissionById(@Param('id') id: string) {
    return this.permissionsService.getPermissionById(id);
  }

  @Post('permissions')
  async createPermission(
    @Body(ValidationPipe) createPermissionDto: CreatePermissionDto,
    @Req() req: any
  ) {
    return this.permissionsService.createPermission(
      createPermissionDto,
      new Types.ObjectId(req.user._id)
    );
  }

  @Put('permissions/:id')
  async updatePermission(
    @Param('id') id: string,
    @Body(ValidationPipe) updatePermissionDto: UpdatePermissionDto
  ) {
    return this.permissionsService.updatePermission(id, updatePermissionDto);
  }

  @Delete('permissions/:id')
  async deletePermission(@Param('id') id: string) {
    return this.permissionsService.deletePermission(id);
  }

  // Role endpoints
  @Get('roles')
  async getAllRoles(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('contextType') contextType?: 'SYSTEM' | 'ORGANIZATION'
  ) {
    return this.permissionsService.getAllRoles(+page, +limit, contextType);
  }

  @Get('roles/:id')
  async getRoleById(@Param('id') id: string) {
    return this.permissionsService.getRoleById(id);
  }

  @Post('roles')
  async createRole(
    @Body(ValidationPipe) createRoleDto: CreateRoleDto,
    @Req() req: any
  ) {
    return this.permissionsService.createRole(
      createRoleDto,
      new Types.ObjectId(req.user._id)
    );
  }

  @Put('roles/:id')
  async updateRole(
    @Param('id') id: string,
    @Body(ValidationPipe) updateRoleDto: UpdateRoleDto
  ) {
    return this.permissionsService.updateRole(id, updateRoleDto);
  }

  @Delete('roles/:id')
  async deleteRole(@Param('id') id: string) {
    return this.permissionsService.deleteRole(id);
  }

  // Role Permission endpoints
  @Get('roles/:roleId/permissions')
  async getRolePermissions(@Param('roleId') roleId: string) {
    return this.permissionsService.getRolePermissions(roleId);
  }

  @Post('roles/:roleId/permissions')
  async assignPermissionsToRole(
    @Param('roleId') roleId: string,
    @Body(ValidationPipe) assignPermissionDto: { permissionIds: string[] },
    @Req() req: any
  ) {
    return this.permissionsService.assignPermissionsToRole(
      roleId,
      assignPermissionDto.permissionIds,
      new Types.ObjectId(req.user._id)
    );
  }

  @Delete('roles/:roleId/permissions/:permissionId')
  async removePermissionFromRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string
  ) {
    return this.permissionsService.removePermissionFromRole(
      roleId,
      permissionId
    );
  }

  // User Organization Role endpoints
  @Get('users/:userId/organization-roles')
  async getUserOrganizationRoles(
    @Param('userId') userId: string,
    @Query('organizationId') organizationId?: string
  ) {
    const userObjectId = new Types.ObjectId(userId);
    let orgObjectId = undefined;

    if (organizationId) {
      orgObjectId = new Types.ObjectId(organizationId);
    }

    return this.permissionsService.getUserOrganizationRoles(
      userObjectId,
      orgObjectId
    );
  }

  @Post('users/:userId/organization-roles')
  async assignRoleToUser(
    @Param('userId') userId: string,
    @Body(ValidationPipe) assignRoleDto: AssignRoleDto,
    @Req() req: any
  ) {
    if (!assignRoleDto.organizationId) {
      throw new BadRequestException('Organization ID is required');
    }

    return this.permissionsService.assignRoleToUser(
      new Types.ObjectId(userId),
      assignRoleDto.roleId,
      new Types.ObjectId(assignRoleDto.organizationId),
      new Types.ObjectId(req.user._id),
      assignRoleDto.isPrimary || false,
      assignRoleDto.activeFrom,
      assignRoleDto.activeTo
    );
  }

  @Delete('users/:userId/organization-roles/:roleId')
  async removeRoleFromUser(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @Query('organizationId') organizationId: string
  ) {
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }

    return this.permissionsService.removeRoleFromUser(
      new Types.ObjectId(userId),
      roleId,
      new Types.ObjectId(organizationId)
    );
  }

  // User Custom Permission endpoints
  @Get('users/:userId/custom-permissions')
  async getUserCustomPermissions(
    @Param('userId') userId: string,
    @Query('contextType') contextType?: 'SYSTEM' | 'ORGANIZATION',
    @Query('organizationId') organizationId?: string
  ) {
    const userObjectId = new Types.ObjectId(userId);
    let orgObjectId = undefined;

    if (organizationId) {
      orgObjectId = new Types.ObjectId(organizationId);
    }

    return this.permissionsService.getUserCustomPermissions(
      userObjectId,
      contextType,
      orgObjectId
    );
  }

  @Post('users/:userId/custom-permissions')
  async assignCustomPermissionToUser(
    @Param('userId') userId: string,
    @Body(ValidationPipe) assignPermissionDto: AssignPermissionDto,
    @Req() req: any
  ) {
    let contextId = undefined;

    if (assignPermissionDto.contextId) {
      contextId = new Types.ObjectId(assignPermissionDto.contextId);
    }

    return this.permissionsService.assignCustomPermissionToUser(
      new Types.ObjectId(userId),
      assignPermissionDto.permissionId,
      assignPermissionDto.contextType,
      contextId,
      new Types.ObjectId(req.user._id),
      assignPermissionDto.expiresAt
    );
  }

  @Delete('users/:userId/custom-permissions/:permissionId')
  async removeCustomPermissionFromUser(
    @Param('userId') userId: string,
    @Param('permissionId') permissionId: string,
    @Query('contextType') contextType: 'SYSTEM' | 'ORGANIZATION',
    @Query('contextId') contextId?: string
  ) {
    if (!contextType) {
      throw new BadRequestException('Context type is required');
    }

    let contextObjectId = undefined;
    if (contextId) {
      contextObjectId = new Types.ObjectId(contextId);
    }

    return this.permissionsService.removeCustomPermissionFromUser(
      new Types.ObjectId(userId),
      permissionId,
      contextType,
      contextObjectId
    );
  }

  // Permission Implication endpoints
  @Get('permission-implications')
  async getAllPermissionImplications(
    @Query('parentId') parentId?: string,
    @Query('childId') childId?: string
  ) {
    return this.permissionsService.getPermissionImplications(parentId, childId);
  }

  @Post('permission-implications')
  async createPermissionImplication(
    @Body(ValidationPipe)
    createImplicationDto: {
      parentPermissionId: string;
      childPermissionId: string;
    }
  ) {
    return this.permissionsService.createPermissionImplication(
      createImplicationDto.parentPermissionId,
      createImplicationDto.childPermissionId
    );
  }

  @Delete('permission-implications/:parentId/:childId')
  async removePermissionImplication(
    @Param('parentId') parentId: string,
    @Param('childId') childId: string
  ) {
    return this.permissionsService.removePermissionImplication(
      parentId,
      childId
    );
  }

  // User Effective Permissions endpoint
  @Get('users/:userId/effective-permissions')
  async getUserEffectivePermissions(
    @Param('userId') userId: string,
    @Query('organizationId') organizationId?: string,
    @Query('contextType') contextType?: 'SYSTEM' | 'ORGANIZATION'
  ) {
    const userObjectId = new Types.ObjectId(userId);
    let orgObjectId = undefined;

    if (organizationId) {
      orgObjectId = new Types.ObjectId(organizationId);
    }

    return this.permissionsService.getUserEffectivePermissions(
      userObjectId,
      contextType,
      orgObjectId
    );
  }
}

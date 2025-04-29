// super-admin/services/super-admin-permissions.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import {
  OrganizationRole,
  OrganizationRoleDocument,
  Permission,
  PermissionDocument,
  PermissionImplication,
  PermissionImplicationDocument,
  Role,
  RoleDocument,
  RolePermission,
  RolePermissionDocument,
  UserCustomPermission,
  UserCustomPermissionDocument,
} from 'libs/api/core/src/lib/schemas';

@Injectable()
export class SuperAdminPermissionsService {
  constructor(
    @InjectModel(Permission.name)
    private permissionModel: Model<PermissionDocument>,
    @InjectModel(Role.name)
    private roleModel: Model<RoleDocument>,
    @InjectModel(RolePermission.name)
    private rolePermissionModel: Model<RolePermissionDocument>,
    @InjectModel(OrganizationRole.name)
    private organizationRoleModel: Model<OrganizationRoleDocument>,
    @InjectModel(UserCustomPermission.name)
    private userCustomPermissionModel: Model<UserCustomPermissionDocument>,
    @InjectModel(PermissionImplication.name)
    private permissionImplicationModel: Model<PermissionImplicationDocument>
  ) {}

  // Permission methods
  async getAllPermissions(
    page: number,
    limit: number,
    category?: string,
    contextType?: 'SYSTEM' | 'ORGANIZATION'
  ) {
    const query: any = {};

    if (category) {
      query.category = category;
    }

    if (contextType) {
      query.contextType = contextType;
    }

    const skip = (page - 1) * limit;

    const [permissions, totalCount] = await Promise.all([
      this.permissionModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ category: 1, name: 1 })
        .lean(),
      this.permissionModel.countDocuments(query),
    ]);

    return {
      data: permissions,
      meta: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    };
  }

  async getPermissionById(id: string) {
    const permission = await this.permissionModel.findOne({ id }).lean();

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return permission;
  }

  async createPermission(
    createPermissionDto: CreatePermissionDto,
    createdById: Types.ObjectId
  ) {
    // Check if permission with this ID already exists
    const existingPermission = await this.permissionModel.findOne({
      id: createPermissionDto.id,
    });

    if (existingPermission) {
      throw new BadRequestException(
        `Permission with ID ${createPermissionDto.id} already exists`
      );
    }

    // Create new permission
    const newPermission = new this.permissionModel(createPermissionDto);
    await newPermission.save();

    return newPermission;
  }

  async updatePermission(id: string, updatePermissionDto: UpdatePermissionDto) {
    const updatedPermission = await this.permissionModel
      .findOneAndUpdate({ id }, updatePermissionDto, { new: true })
      .lean();

    if (!updatedPermission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return updatedPermission;
  }

  async deletePermission(id: string) {
    // Check if permission exists
    const permission = await this.permissionModel.findOne({ id });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    // Check if permission is used in any role
    const rolePermissionCount = await this.rolePermissionModel.countDocuments({
      permissionId: id,
    });

    if (rolePermissionCount > 0) {
      throw new BadRequestException(
        `Cannot delete permission ${id} as it is assigned to ${rolePermissionCount} roles`
      );
    }

    // Check if permission is used in any user custom permission
    const userPermissionCount =
      await this.userCustomPermissionModel.countDocuments({
        permissionId: id,
      });

    if (userPermissionCount > 0) {
      throw new BadRequestException(
        `Cannot delete permission ${id} as it is directly assigned to ${userPermissionCount} users`
      );
    }

    // Check if permission is used in any implication
    const implicationCount =
      await this.permissionImplicationModel.countDocuments({
        $or: [{ parentPermissionId: id }, { childPermissionId: id }],
      });

    if (implicationCount > 0) {
      throw new BadRequestException(
        `Cannot delete permission ${id} as it is used in ${implicationCount} permission implications`
      );
    }

    // Delete the permission
    await this.permissionModel.deleteOne({ id });

    return { success: true, message: `Permission ${id} deleted successfully` };
  }

  // Role methods
  async getAllRoles(
    page: number,
    limit: number,
    contextType?: 'SYSTEM' | 'ORGANIZATION'
  ) {
    const query: any = {};

    if (contextType) {
      query.contextType = contextType;
    }

    const skip = (page - 1) * limit;

    const [roles, totalCount] = await Promise.all([
      this.roleModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ hierarchyLevel: 1, name: 1 })
        .lean(),
      this.roleModel.countDocuments(query),
    ]);

    return {
      data: roles,
      meta: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    };
  }

  async getRoleById(id: string) {
    const role = await this.roleModel.findOne({ id }).lean();

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async createRole(createRoleDto: CreateRoleDto, createdById: Types.ObjectId) {
    // Check if role with this ID already exists
    const existingRole = await this.roleModel.findOne({
      id: createRoleDto.id,
    });

    if (existingRole) {
      throw new BadRequestException(
        `Role with ID ${createRoleDto.id} already exists`
      );
    }

    // Check if baseRoleId exists if provided
    if (createRoleDto.baseRoleId) {
      const baseRole = await this.roleModel.findOne({
        id: createRoleDto.baseRoleId,
      });

      if (!baseRole) {
        throw new BadRequestException(
          `Base role with ID ${createRoleDto.baseRoleId} not found`
        );
      }
    }

    // Create new role
    const newRole = new this.roleModel(createRoleDto);
    await newRole.save();

    // If baseRoleId is provided, copy permissions from base role
    if (createRoleDto.baseRoleId) {
      await this.copyPermissionsFromBaseRole(
        createRoleDto.id,
        createRoleDto.baseRoleId
      );
    }

    return newRole;
  }

  private async copyPermissionsFromBaseRole(
    roleId: string,
    baseRoleId: string
  ) {
    // Get permissions from base role
    const baseRolePermissions = await this.rolePermissionModel.find({
      roleId: baseRoleId,
    });

    // Create new role permissions
    const newRolePermissions = baseRolePermissions.map((permission) => ({
      roleId,
      permissionId: permission.permissionId,
    }));

    if (newRolePermissions.length > 0) {
      await this.rolePermissionModel.insertMany(newRolePermissions);
    }
  }

  async updateRole(id: string, updateRoleDto: UpdateRoleDto) {
    // Check if changing baseRoleId
    const oldRole = await this.roleModel.findOne({ id });

    if (!oldRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Check if new baseRoleId exists if provided
    if (
      updateRoleDto.baseRoleId &&
      updateRoleDto.baseRoleId !== oldRole.baseRoleId
    ) {
      const baseRole = await this.roleModel.findOne({
        id: updateRoleDto.baseRoleId,
      });

      if (!baseRole) {
        throw new BadRequestException(
          `Base role with ID ${updateRoleDto.baseRoleId} not found`
        );
      }

      // Clear existing permissions and copy from new base role
      if (updateRoleDto.baseRoleId) {
        await this.rolePermissionModel.deleteMany({ roleId: id });
        await this.copyPermissionsFromBaseRole(id, updateRoleDto.baseRoleId);
      }
    }

    const updatedRole = await this.roleModel
      .findOneAndUpdate({ id }, updateRoleDto, { new: true })
      .lean();

    return updatedRole;
  }

  async deleteRole(id: string) {
    // Check if role exists
    const role = await this.roleModel.findOne({ id });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Check if role is assigned to any users
    const userRoleCount = await this.organizationRoleModel.countDocuments({
      roleId: id,
    });

    if (userRoleCount > 0) {
      throw new BadRequestException(
        `Cannot delete role ${id} as it is assigned to ${userRoleCount} users`
      );
    }

    // Check if role is used as a base role
    const derivedRoleCount = await this.roleModel.countDocuments({
      baseRoleId: id,
    });

    if (derivedRoleCount > 0) {
      throw new BadRequestException(
        `Cannot delete role ${id} as it is used as a base role for ${derivedRoleCount} other roles`
      );
    }

    // Delete role permissions
    await this.rolePermissionModel.deleteMany({ roleId: id });

    // Delete the role
    await this.roleModel.deleteOne({ id });

    return { success: true, message: `Role ${id} deleted successfully` };
  }

  // Role Permission methods
  async getRolePermissions(roleId: string) {
    // Check if role exists
    const role = await this.roleModel.findOne({ id: roleId });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Get direct permissions assigned to role
    const rolePermissions = await this.rolePermissionModel
      .find({ roleId })
      .lean();

    const permissionIds = rolePermissions.map((rp) => rp.permissionId);

    // Get permission details
    const permissions = await this.permissionModel
      .find({ id: { $in: permissionIds } })
      .lean();

    return permissions;
  }

  async assignPermissionsToRole(
    roleId: string,
    permissionIds: string[],
    assignedById: Types.ObjectId
  ) {
    // Check if role exists
    const role = await this.roleModel.findOne({ id: roleId });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Check if all permissions exist
    const permissions = await this.permissionModel
      .find({ id: { $in: permissionIds } })
      .lean();

    if (permissions.length !== permissionIds.length) {
      throw new BadRequestException('One or more permissions do not exist');
    }

    // Get existing permissions for role to avoid duplicates
    const existingPermissions = await this.rolePermissionModel
      .find({ roleId })
      .lean();

    const existingPermissionIds = existingPermissions.map(
      (p) => p.permissionId
    );

    // Filter out permissions that are already assigned
    const newPermissionIds = permissionIds.filter(
      (id) => !existingPermissionIds.includes(id)
    );

    // Create new role permissions
    const newRolePermissions = newPermissionIds.map((permissionId) => ({
      roleId,
      permissionId,
    }));

    if (newRolePermissions.length > 0) {
      await this.rolePermissionModel.insertMany(newRolePermissions);
    }

    return {
      success: true,
      added: newRolePermissions.length,
      alreadyAssigned: permissionIds.length - newRolePermissions.length,
    };
  }

  async removePermissionFromRole(roleId: string, permissionId: string) {
    // Check if role exists
    const role = await this.roleModel.findOne({ id: roleId });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Check if permission exists
    const permission = await this.permissionModel.findOne({ id: permissionId });

    if (!permission) {
      throw new NotFoundException(
        `Permission with ID ${permissionId} not found`
      );
    }

    // Delete role permission
    const result = await this.rolePermissionModel.deleteOne({
      roleId,
      permissionId,
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException(
        `Permission ${permissionId} is not assigned to role ${roleId}`
      );
    }

    return {
      success: true,
      message: `Permission ${permissionId} removed from role ${roleId}`,
    };
  }

  // Organization Role methods
  async getUserOrganizationRoles(
    userId: Types.ObjectId,
    organizationId?: Types.ObjectId
  ) {
    const query: any = { userId };

    if (organizationId) {
      query.organizationId = organizationId;
    }

    const userRoles = await this.organizationRoleModel
      .find(query)
      .populate('roleId')
      .populate('organizationId', 'name')
      .lean();

    return userRoles;
  }

  async assignRoleToUser(
    userId: Types.ObjectId,
    roleId: string,
    organizationId: Types.ObjectId,
    assignedById: Types.ObjectId,
    isPrimary: boolean = false,
    activeFrom?: Date,
    activeTo?: Date
  ) {
    // Check if role exists
    const role = await this.roleModel.findOne({ id: roleId });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Check if user already has this role in this organization
    const existingRole = await this.organizationRoleModel.findOne({
      userId,
      roleId,
      organizationId,
    });

    if (existingRole) {
      throw new BadRequestException(
        `User already has role ${roleId} in this organization`
      );
    }

    // If setting as primary, unset any existing primary roles for this user in this org
    if (isPrimary) {
      await this.organizationRoleModel.updateMany(
        { userId, organizationId, isPrimary: true },
        { isPrimary: false }
      );
    }

    // Create new organization role
    const newOrganizationRole = new this.organizationRoleModel({
      userId,
      roleId,
      organizationId,
      isPrimary,
      activeFrom,
      activeTo,
      isActive: true,
      assignedById,
      assignedAt: new Date(),
    });

    await newOrganizationRole.save();

    return newOrganizationRole;
  }

  async removeRoleFromUser(
    userId: Types.ObjectId,
    roleId: string,
    organizationId: Types.ObjectId
  ) {
    // Check if user has this role
    const userRole = await this.organizationRoleModel.findOne({
      userId,
      roleId,
      organizationId,
    });

    if (!userRole) {
      throw new NotFoundException(
        `User does not have role ${roleId} in this organization`
      );
    }

    // Delete the role assignment
    await this.organizationRoleModel.deleteOne({
      userId,
      roleId,
      organizationId,
    });

    return {
      success: true,
      message: `Role ${roleId} removed from user in organization`,
    };
  }

  // User Custom Permission methods
  async getUserCustomPermissions(
    userId: Types.ObjectId,
    contextType?: 'SYSTEM' | 'ORGANIZATION',
    contextId?: Types.ObjectId
  ) {
    const query: any = { userId };

    if (contextType) {
      query.contextType = contextType;
    }

    if (contextId) {
      query.contextId = contextId;
    }

    const userPermissions = await this.userCustomPermissionModel
      .find(query)
      .populate('permissionId')
      .lean();

    return userPermissions;
  }

  async assignCustomPermissionToUser(
    userId: Types.ObjectId,
    permissionId: string,
    contextType: 'SYSTEM' | 'ORGANIZATION',
    contextId: Types.ObjectId | undefined,
    grantedById: Types.ObjectId,
    expiresAt?: Date
  ) {
    // Check if permission exists
    const permission = await this.permissionModel.findOne({ id: permissionId });

    if (!permission) {
      throw new NotFoundException(
        `Permission with ID ${permissionId} not found`
      );
    }

    // Check if user already has this permission
    const query: any = {
      userId,
      permissionId,
      contextType,
    };

    if (contextId) {
      query.contextId = contextId;
    }

    const existingPermission = await this.userCustomPermissionModel.findOne(
      query
    );

    if (existingPermission) {
      // Update expiration if different
      if (expiresAt?.getTime() !== existingPermission.expiresAt?.getTime()) {
        existingPermission.expiresAt = expiresAt;
        await existingPermission.save();
        return existingPermission;
      }

      throw new BadRequestException(
        `User already has permission ${permissionId} in this context`
      );
    }

    // Create new user custom permission
    const newUserPermission = new this.userCustomPermissionModel({
      userId,
      permissionId,
      contextType,
      contextId,
      grantedById,
      grantedAt: new Date(),
      expiresAt,
    });

    await newUserPermission.save();

    return newUserPermission;
  }

  async removeCustomPermissionFromUser(
    userId: Types.ObjectId,
    permissionId: string,
    contextType: 'SYSTEM' | 'ORGANIZATION',
    contextId?: Types.ObjectId
  ) {
    // Prepare query
    const query: any = {
      userId,
      permissionId,
      contextType,
    };

    if (contextId) {
      query.contextId = contextId;
    }

    // Check if user has this permission
    const userPermission = await this.userCustomPermissionModel.findOne(query);

    if (!userPermission) {
      throw new NotFoundException(
        `User does not have custom permission ${permissionId} in this context`
      );
    }

    // Delete the permission assignment
    await this.userCustomPermissionModel.deleteOne(query);

    return {
      success: true,
      message: `Custom permission ${permissionId} removed from user`,
    };
  }

  // Permission Implication methods
  async getPermissionImplications(parentId?: string, childId?: string) {
    const query: any = {};

    if (parentId) {
      query.parentPermissionId = parentId;
    }

    if (childId) {
      query.childPermissionId = childId;
    }

    const implications = await this.permissionImplicationModel
      .find(query)
      .lean();

    return implications;
  }

  async createPermissionImplication(
    parentPermissionId: string,
    childPermissionId: string
  ) {
    // Check if both permissions exist
    const [parentPermission, childPermission] = await Promise.all([
      this.permissionModel.findOne({ id: parentPermissionId }),
      this.permissionModel.findOne({ id: childPermissionId }),
    ]);

    if (!parentPermission) {
      throw new NotFoundException(
        `Parent permission ${parentPermissionId} not found`
      );
    }

    if (!childPermission) {
      throw new NotFoundException(
        `Child permission ${childPermissionId} not found`
      );
    }

    // Check for circular implications
    const wouldCreateCircular = await this.checkCircularImplication(
      childPermissionId,
      parentPermissionId
    );

    if (wouldCreateCircular) {
      throw new BadRequestException(
        `Adding this implication would create a circular dependency`
      );
    }

    // Check if implication already exists
    const existingImplication = await this.permissionImplicationModel.findOne({
      parentPermissionId,
      childPermissionId,
    });

    if (existingImplication) {
      throw new BadRequestException(
        `Implication from ${parentPermissionId} to ${childPermissionId} already exists`
      );
    }

    // Create new implication
    const newImplication = new this.permissionImplicationModel({
      parentPermissionId,
      childPermissionId,
    });

    await newImplication.save();

    return newImplication;
  }

  private async checkCircularImplication(
    startPermissionId: string,
    targetPermissionId: string,
    visited: Set<string> = new Set()
  ): Promise<boolean> {
    if (visited.has(startPermissionId)) {
      return false;
    }

    visited.add(startPermissionId);

    const implications = await this.permissionImplicationModel.find({
      parentPermissionId: startPermissionId,
    });

    for (const implication of implications) {
      if (implication.childPermissionId === targetPermissionId) {
        return true;
      }

      const isCircular = await this.checkCircularImplication(
        implication.childPermissionId,
        targetPermissionId,
        visited
      );

      if (isCircular) {
        return true;
      }
    }

    return false;
  }

  async removePermissionImplication(
    parentPermissionId: string,
    childPermissionId: string
  ) {
    // Check if implication exists
    const implication = await this.permissionImplicationModel.findOne({
      parentPermissionId,
      childPermissionId,
    });

    if (!implication) {
      throw new NotFoundException(
        `Implication from ${parentPermissionId} to ${childPermissionId} not found`
      );
    }

    // Delete the implication
    await this.permissionImplicationModel.deleteOne({
      parentPermissionId,
      childPermissionId,
    });

    return {
      success: true,
      message: `Implication from ${parentPermissionId} to ${childPermissionId} removed`,
    };
  }

  // User Effective Permissions
  async getUserEffectivePermissions(
    userId: Types.ObjectId,
    contextType?: 'SYSTEM' | 'ORGANIZATION',
    organizationId?: Types.ObjectId
  ) {
    // Get roles for this user
    const query: any = { userId, isActive: true };

    if (organizationId) {
      query.organizationId = organizationId;
    }

    const userRoles = await this.organizationRoleModel.find(query).lean();

    const roleIds = userRoles.map((role) => role.roleId);

    // Get permissions from roles
    const rolePermissions = await this.rolePermissionModel
      .find({ roleId: { $in: roleIds } })
      .lean();

    let permissionIds = rolePermissions.map((rp) => rp.permissionId);

    // Get custom permissions for user
    const customPermissionsQuery: any = { userId };

    if (contextType) {
      customPermissionsQuery.contextType = contextType;
    }

    if (organizationId) {
      customPermissionsQuery.contextId = organizationId;
    }

    // Only include non-expired permissions
    customPermissionsQuery.$or = [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } },
    ];

    const customPermissions = await this.userCustomPermissionModel
      .find(customPermissionsQuery)
      .lean();

    // Add custom permissions to the list
    permissionIds = [
      ...permissionIds,
      ...customPermissions.map((cp) => cp.permissionId),
    ];

    // Get all implied permissions
    const allPermissionIds = await this.getAllImpliedPermissions(permissionIds);

    // Get permission details
    const permissions = await this.permissionModel
      .find({ id: { $in: allPermissionIds } })
      .lean();

    return permissions;
  }

  private async getAllImpliedPermissions(
    permissionIds: string[]
  ): Promise<string[]> {
    const allPermissionIds = new Set(permissionIds);

    for (const permissionId of permissionIds) {
      const impliedIds = await this.getImpliedPermissionsRecursive(
        permissionId
      );
      for (const id of impliedIds) {
        allPermissionIds.add(id);
      }
    }

    return Array.from(allPermissionIds);
  }

  private async getImpliedPermissionsRecursive(
    permissionId: string,
    visited: Set<string> = new Set()
  ): Promise<string[]> {
    if (visited.has(permissionId)) {
      return [];
    }

    visited.add(permissionId);

    const implications = await this.permissionImplicationModel
      .find({ parentPermissionId: permissionId })
      .lean();

    const childPermissionIds = implications.map(
      (impl) => impl.childPermissionId
    );

    const result = new Set(childPermissionIds);

    for (const childId of childPermissionIds) {
      const nestedImplied = await this.getImpliedPermissionsRecursive(
        childId,
        visited
      );
      for (const id of nestedImplied) {
        result.add(id);
      }
    }

    return Array.from(result);
  }
}

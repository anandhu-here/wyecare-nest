import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from '../../../../../core/src/lib/schemas';
import {
  RolePermission,
  RolePermissionDocument,
} from '../../../../../core/src/lib/schemas';
import {
  OrganizationRole,
  OrganizationRoleDocument,
} from '../../../../../core/src/lib/schemas';
import { Types } from 'mongoose';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(RolePermission.name)
    private rolePermissionModel: Model<RolePermissionDocument>,
    @InjectModel(OrganizationRole.name)
    private organizationRoleModel: Model<OrganizationRoleDocument>
  ) {}

  async findAll(): Promise<Role[]> {
    return this.roleModel.find().sort({ hierarchyLevel: 1 }).exec();
  }

  async findById(id: string): Promise<Role> {
    const role = await this.roleModel.findOne({ id }).exec();
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  async findByContextType(
    contextType: 'SYSTEM' | 'ORGANIZATION'
  ): Promise<Role[]> {
    return this.roleModel
      .find({ contextType })
      .sort({ hierarchyLevel: 1 })
      .exec();
  }

  async getPermissionsForRole(roleId: string): Promise<string[]> {
    const rolePermissions = await this.rolePermissionModel
      .find({ roleId })
      .exec();
    return rolePermissions.map((rp) => rp.permissionId);
  }

  async getUserRoles(userId: Types.ObjectId): Promise<string[]> {
    const organizationRoles = await this.organizationRoleModel
      .find({ userId, isActive: true })
      .exec();

    return organizationRoles.map((orgRole) => orgRole.roleId);
  }

  async getRolesByOrganizationCategory(category: string): Promise<Role[]> {
    return this.roleModel
      .find({
        $or: [
          { organizationCategories: '*' },
          { organizationCategories: category },
        ],
      })
      .exec();
  }

  async getUserRolesForOrganization(
    userId: Types.ObjectId,
    organizationId: Types.ObjectId
  ): Promise<string[]> {
    const organizationRoles = await this.organizationRoleModel
      .find({ userId, organizationId, isActive: true })
      .exec();

    return organizationRoles.map((orgRole) => orgRole.roleId);
  }

  async getRoleHierarchy(roleId: string): Promise<Role[]> {
    const role = await this.findById(roleId);
    const roles = [role];

    // If this role has a base role, recursively get the base role hierarchy
    if (role.baseRoleId) {
      const baseRoleHierarchy = await this.getRoleHierarchy(role.baseRoleId);
      roles.push(...baseRoleHierarchy);
    }

    return roles;
  }

  async assignRoleToUser(
    userId: Types.ObjectId,
    organizationId: Types.ObjectId,
    roleId: string,
    assignedById?: Types.ObjectId,
    isPrimary: boolean = false
  ): Promise<OrganizationRole> {
    // If this is set as primary, first unset any existing primary roles
    if (isPrimary) {
      await this.organizationRoleModel.updateMany(
        { userId, organizationId, isPrimary: true },
        { $set: { isPrimary: false } }
      );
    }

    // Create the new organization role
    const newOrgRole = new this.organizationRoleModel({
      userId,
      organizationId,
      roleId,
      isPrimary,
      assignedById,
      isActive: true,
      assignedAt: new Date(),
    });

    return newOrgRole.save();
  }
}

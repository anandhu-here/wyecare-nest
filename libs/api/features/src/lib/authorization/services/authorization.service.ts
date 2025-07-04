import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PermissionsService } from './permissions.service';
import { RolesService } from './roles.service';
import {
  UserCustomPermission,
  UserCustomPermissionDocument,
} from '../../../../../core/src/lib/schemas';
import {
  OrganizationRole,
  OrganizationRoleDocument,
} from '../../../../../core/src/lib/schemas';
import {
  RolePermission,
  RolePermissionDocument,
} from '../../../../../core/src/lib/schemas';
import {
  PermissionImplication,
  PermissionImplicationDocument,
} from '../../../../../core/src/lib/schemas';
import { Role, RoleDocument } from '../../../../../core/src/lib/schemas';

interface PermissionContext {
  organizationId?: Types.ObjectId;
  contextType: 'SYSTEM' | 'ORGANIZATION';
}

@Injectable()
export class AuthorizationService {
  private readonly logger = new Logger(AuthorizationService.name);

  constructor(
    @InjectModel(UserCustomPermission.name)
    private userCustomPermissionModel: Model<UserCustomPermissionDocument>,
    @InjectModel(OrganizationRole.name)
    private organizationRoleModel: Model<OrganizationRoleDocument>,
    @InjectModel(RolePermission.name)
    private rolePermissionModel: Model<RolePermissionDocument>,
    @InjectModel(PermissionImplication.name)
    private permissionImplicationModel: Model<PermissionImplicationDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    private permissionsService: PermissionsService,
    private rolesService: RolesService
  ) {}

  /**
   * Validate that a user has access to a specific organization
   */
  async validateUserOrganizationAccess(
    userId: Types.ObjectId,
    organizationId: Types.ObjectId
  ): Promise<boolean> {
    try {
      // Check if user has any role in this organization
      const orgRole = await this.organizationRoleModel
        .findOne({
          userId,
          organizationId,
          isActive: true,
        })
        .exec();

      return !!orgRole;
    } catch (error: any) {
      this.logger.error(
        `Error validating organization access: ${error.message}`,
        error.stack
      );
      return false;
    }
  }

  /**
   * Get all permissions for a user in a given context
   */
  async getAllUserPermissions(
    userId: Types.ObjectId,
    context: PermissionContext
  ): Promise<string[]> {
    try {
      const permissionSet = new Set<string>();

      // 1. Get direct custom permissions
      const customPermissionsQuery: any = {
        userId,
        contextType: context.contextType,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } },
        ],
      };

      // Add contextId only for ORGANIZATION context
      if (context.contextType === 'ORGANIZATION' && context.organizationId) {
        customPermissionsQuery.contextId = context.organizationId;
      }

      const userCustomPermissions = await this.userCustomPermissionModel
        .find(customPermissionsQuery)
        .exec();

      // Add custom permissions to the set
      userCustomPermissions.forEach((permission) => {
        permissionSet.add(permission.permissionId);
      });

      console.log(
        context.contextType,
        'customPermissions:',
        userCustomPermissions
      );

      // // For SYSTEM context, we only consider custom permissions
      // if (context.contextType === 'SYSTEM') {
      //   return Array.from(permissionSet);
      // }

      console.log(context.organizationId, 'context.organizationId:');
      // The rest applies only to ORGANIZATION context
      if (!context.organizationId) {
        this.logger.debug(
          'No organization ID provided for organization context'
        );
        return Array.from(permissionSet);
      }

      // 2. Get role-based permissions
      const userRoles = await this.getUserRolesForOrganization(
        userId,
        context.organizationId
      );

      console.log('userRoles:', userRoles);

      if (userRoles.length > 0) {
        const rolePermissions = await this.rolePermissionModel
          .find({
            roleId: { $in: userRoles },
          })
          .exec();

        // Add role permissions to the set
        rolePermissions.forEach((permission) => {
          permissionSet.add(permission.permissionId);
        });

        // 3. Add permissions from role hierarchy
        for (const roleId of userRoles) {
          const hierarchyPermissions =
            await this.getPermissionsFromRoleHierarchy(roleId);
          hierarchyPermissions.forEach((permId) => permissionSet.add(permId));
        }
      }

      // 4. Add implied permissions
      const directPermissions = Array.from(permissionSet);
      const impliedPermissions = await this.getImpliedPermissions(
        directPermissions
      );
      impliedPermissions.forEach((permId) => permissionSet.add(permId));

      return Array.from(permissionSet);
    } catch (error: any) {
      this.logger.error(
        `Error getting user permissions: ${error.message}`,
        error.stack
      );
      return [];
    }
  }

  /**
   * Helper method to get permissions from role hierarchy
   */
  private async getPermissionsFromRoleHierarchy(
    roleId: string,
    processedRoles: Set<string> = new Set()
  ): Promise<string[]> {
    // Prevent circular references
    if (processedRoles.has(roleId)) {
      return [];
    }

    processedRoles.add(roleId);
    const permissionSet = new Set<string>();

    try {
      // Get permissions for this role
      const rolePermissions = await this.rolePermissionModel
        .find({ roleId })
        .exec();

      rolePermissions.forEach((perm) => {
        permissionSet.add(perm.permissionId);
      });

      // Check if this role has a base role
      const role = await this.roleModel.findOne({ id: roleId }).exec();

      if (role?.baseRoleId) {
        const baseRolePermissions = await this.getPermissionsFromRoleHierarchy(
          role.baseRoleId,
          processedRoles
        );

        baseRolePermissions.forEach((permId) => {
          permissionSet.add(permId);
        });
      }

      return Array.from(permissionSet);
    } catch (error: any) {
      this.logger.error(
        `Error in role hierarchy traversal: ${error.message}`,
        error.stack
      );
      return [];
    }
  }

  /**
   * Helper method to get all implied permissions
   */
  private async getImpliedPermissions(
    permissionIds: string[]
  ): Promise<string[]> {
    if (permissionIds.length === 0) {
      return [];
    }

    const permissionSet = new Set<string>();

    try {
      // Find direct implications
      const implications = await this.permissionImplicationModel
        .find({
          childPermissionId: { $in: permissionIds },
        })
        .exec();

      const parentPermIds = implications.map((imp) => imp.parentPermissionId);

      // Add all parent permissions
      parentPermIds.forEach((permId) => {
        permissionSet.add(permId);
      });

      // Recursively find nested implications
      if (parentPermIds.length > 0) {
        const nestedImplications = await this.getImpliedPermissions(
          parentPermIds
        );
        nestedImplications.forEach((permId) => {
          permissionSet.add(permId);
        });
      }

      return Array.from(permissionSet);
    } catch (error: any) {
      this.logger.error(
        `Error getting implied permissions: ${error.message}`,
        error.stack
      );
      return [];
    }
  }

  /**
   * Check if a user has a specific permission in a given context
   */
  async hasPermission(
    userId: Types.ObjectId,
    permissionId: string,
    context: PermissionContext
  ): Promise<boolean> {
    try {
      this.logger.debug(
        `Checking permission ${permissionId} for user ${userId} in context:`,
        context
      );

      // 1. Check direct custom permissions based on context type
      const queryCondition: any = {
        userId,
        permissionId,
        contextType: context.contextType,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } },
        ],
      };

      // Add contextId only for ORGANIZATION context
      if (context.contextType === 'ORGANIZATION' && context.organizationId) {
        queryCondition.contextId = context.organizationId;
      }

      const userCustomPermission = await this.userCustomPermissionModel
        .findOne(queryCondition)
        .exec();

      if (userCustomPermission) {
        this.logger.debug(`Found direct custom permission: ${permissionId}`);
        return true;
      }

      // If SYSTEM context, we only check custom permissions
      if (context.contextType === 'SYSTEM') {
        return false;
      }

      // The rest of the code only applies to ORGANIZATION context
      if (!context.organizationId) {
        this.logger.debug(
          'No organization ID provided for organization context check'
        );
        return false;
      }

      // 2. Check role-based permissions
      const userRoles = await this.getUserRolesForOrganization(
        userId,
        context.organizationId
      );

      if (userRoles.length === 0) {
        this.logger.debug('No roles found for user in organization');
        return false;
      }

      // Check if any of the user's roles have the required permission
      const rolePermissions = await this.rolePermissionModel
        .find({
          roleId: { $in: userRoles },
          permissionId,
        })
        .exec();

      if (rolePermissions.length > 0) {
        this.logger.debug(`Found role-based permission: ${permissionId}`);
        return true;
      }

      // 3. Check permission implications
      const impliedPermissions = await this.permissionImplicationModel
        .find({
          childPermissionId: permissionId,
        })
        .exec();

      if (impliedPermissions.length > 0) {
        const parentPermissionIds = impliedPermissions.map(
          (imp) => imp.parentPermissionId
        );

        // Check if user has any of the parent permissions
        for (const parentPermId of parentPermissionIds) {
          const hasParentPermission = await this.hasPermission(
            userId,
            parentPermId,
            context
          );

          if (hasParentPermission) {
            this.logger.debug(
              `Found implied permission through: ${parentPermId}`
            );
            return true;
          }
        }
      }

      // 4. Check inherited permissions through role hierarchy
      for (const roleId of userRoles) {
        const role = await this.roleModel.findOne({ id: roleId }).exec();

        if (role && role.baseRoleId) {
          // Check if base role has this permission
          const baseRolePermission = await this.rolePermissionModel
            .findOne({
              roleId: role.baseRoleId,
              permissionId,
            })
            .exec();

          if (baseRolePermission) {
            this.logger.debug(
              `Found permission through base role: ${role.baseRoleId}`
            );
            return true;
          }

          // Recursively check base role's permissions
          const hasPermissionViaBaseRole = await this.checkRoleHierarchy(
            role.baseRoleId,
            permissionId
          );

          if (hasPermissionViaBaseRole) {
            this.logger.debug(`Found permission through role hierarchy`);
            return true;
          }
        }
      }

      return false;
    } catch (error: any) {
      this.logger.error(
        `Error checking user permission: ${error.message}`,
        error.stack
      );
      return false;
    }
  }

  /**
   * Helper method to get user roles for an organization
   */
  private async getUserRolesForOrganization(
    userId: Types.ObjectId,
    organizationId: Types.ObjectId
  ): Promise<string[]> {
    try {
      const orgRoles = await this.organizationRoleModel
        .find({
          userId,
          organizationId,
          isActive: true,
        })
        .exec();

      return orgRoles.map((role) => role.roleId);
    } catch (error: any) {
      this.logger.error(`Error getting user roles: ${error.message}`);
      return [];
    }
  }

  /**
   * Helper function to check permissions through role hierarchy
   */
  private async checkRoleHierarchy(
    roleId: string,
    permissionId: string
  ): Promise<boolean> {
    try {
      const rolePermission = await this.rolePermissionModel
        .findOne({
          roleId,
          permissionId,
        })
        .exec();

      if (rolePermission) {
        return true;
      }

      const role = await this.roleModel.findOne({ id: roleId }).exec();

      if (role && role.baseRoleId) {
        return await this.checkRoleHierarchy(role.baseRoleId, permissionId);
      }

      return false;
    } catch (error: any) {
      this.logger.error(
        `Error checking role hierarchy: ${error.message}`,
        error.stack
      );
      return false;
    }
  }

  /**
   * Get all permissions for a user in a given context
   */
  async getUserPermissions(
    userId: Types.ObjectId,
    context: PermissionContext
  ): Promise<string[]> {
    // Implementation similar to previous version
    return this.permissionsService.getAllPermissionsIncludingImplied([]);
  }

  /**
   * Grant a custom permission to a user
   */
  async grantCustomPermission(
    userId: Types.ObjectId,
    permissionId: string,
    grantedById: Types.ObjectId,
    context: PermissionContext,
    expiresAt?: Date
  ): Promise<UserCustomPermission> {
    const customPermission = new this.userCustomPermissionModel({
      userId,
      permissionId,
      contextType: context.contextType,
      contextId: context.organizationId,
      grantedById,
      grantedAt: new Date(),
      expiresAt,
    });

    return customPermission.save();
  }

  /**
   * Revoke a custom permission from a user
   */
  async revokeCustomPermission(
    userId: Types.ObjectId,
    permissionId: string,
    context: PermissionContext
  ): Promise<boolean> {
    const query: any = {
      userId,
      permissionId,
      contextType: context.contextType,
    };

    if (context.organizationId) {
      query.contextId = context.organizationId;
    }

    const result = await this.userCustomPermissionModel
      .deleteMany(query)
      .exec();
    return result.deletedCount > 0;
  }
}

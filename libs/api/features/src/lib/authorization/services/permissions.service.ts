import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Permission,
  PermissionDocument,
} from '../../../../../core/src/lib/schemas';
import {
  PermissionImplication,
  PermissionImplicationDocument,
} from '../../../../../core/src/lib/schemas';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectModel(Permission.name)
    private permissionModel: Model<PermissionDocument>,
    @InjectModel(PermissionImplication.name)
    private permissionImplicationModel: Model<PermissionImplicationDocument>
  ) {}

  async findAll(): Promise<Permission[]> {
    return this.permissionModel.find().exec();
  }

  async findById(id: string): Promise<Permission> {
    const permission = await this.permissionModel.findOne({ id }).exec();
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }
    return permission;
  }

  async findByCategory(category: string): Promise<Permission[]> {
    return this.permissionModel.find({ category }).exec();
  }

  async findByContextType(
    contextType: 'SYSTEM' | 'ORGANIZATION'
  ): Promise<Permission[]> {
    return this.permissionModel.find({ contextType }).exec();
  }

  getPermissionDisplayName(
    permission: Permission,
    organizationCategory: string
  ): string {
    if (
      permission.displayNames &&
      permission.displayNames[organizationCategory]
    ) {
      return permission.displayNames[organizationCategory];
    }
    return permission.name; // Fall back to default name
  }

  async getImpliedPermissions(permissionId: string): Promise<string[]> {
    // Get direct implications
    const directImplications = await this.permissionImplicationModel
      .find({ parentPermissionId: permissionId })
      .exec();

    const childPermissionIds = directImplications.map(
      (implication) => implication.childPermissionId
    );

    // Get nested implications (recursive)
    const nestedPermissionIds: string[] = [];

    for (const childId of childPermissionIds) {
      const nestedIds = await this.getImpliedPermissions(childId);
      nestedPermissionIds.push(...nestedIds);
    }

    // Combine direct and nested implications, ensuring uniqueness
    return [...new Set([...childPermissionIds, ...nestedPermissionIds])];
  }
  async getPermissionsByOrganizationCategory(
    category: string
  ): Promise<Permission[]> {
    return this.permissionModel
      .find({
        $or: [
          { organizationCategories: '*' },
          { organizationCategories: category },
        ],
      })
      .exec();
  }

  async getAllPermissionsIncludingImplied(
    permissionIds: string[]
  ): Promise<string[]> {
    const allPermissions = [...permissionIds];

    for (const permissionId of permissionIds) {
      const impliedPermissions = await this.getImpliedPermissions(permissionId);
      allPermissions.push(...impliedPermissions);
    }

    // Return unique list
    return [...new Set(allPermissions)];
  }
}

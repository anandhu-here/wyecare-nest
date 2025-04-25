import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Organization,
  OrganizationDocument,
} from '../../../../../core/src/lib/schemas';

import { User, UserDocument } from '../../../../../core/src/lib/schemas';
import { EmailService } from 'libs/shared/utils/src/lib/services/email.service';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';
import { NotificationService } from 'libs/shared/utils/src/lib/services/notification.service';
import {
  OrganizationRole,
  OrganizationRoleDocument,
} from '../../../../../core/src/lib/schemas';
import { Role, RoleDocument } from '../../../../../core/src/lib/schemas';
import { AuthorizationService } from '../../authorization/services/authorization.service';
import {
  UserMetadata,
  UserMetadataDocument,
} from '../../../../../core/src/lib/schemas';

// Role hierarchy from highest to lowest authority
const ROLE_HIERARCHY = [
  'owner',
  'admin',
  'manager',
  'supervisor',
  'staff',
  'nurse',
  'intern',
  'carer',
  'senior_carer',
];

interface RoleWithOrg {
  role: string;
  organization: any;
  permissions?: string[];
  staffType?: string;
  isPrimary?: boolean;
}

interface HighestLowestRoles {
  highest: RoleWithOrg;
  lowest: RoleWithOrg;
  primaryRole: RoleWithOrg;
  totalRoles?: RoleWithOrg[];
}

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);
  private readonly roleHierarchy = ROLE_HIERARCHY;

  constructor(
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(Organization.name)
    private organizationModel: Model<OrganizationDocument>,
    @InjectModel(OrganizationRole.name)
    private organizationRoleModel: Model<OrganizationRoleDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private emailService: EmailService,
    private notificationService: NotificationService,
    private authorizationService: AuthorizationService,
    @InjectModel(UserMetadata.name)
    private userMetadataModel: Model<UserMetadataDocument>
  ) {}

  /**
   * Get an organization by ID
   */
  async getOrganization(organizationId: Types.ObjectId): Promise<Organization> {
    const organization = await this.organizationModel
      .findById(organizationId)
      .exec();

    if (!organization) {
      throw new NotFoundException(
        `Organization with ID ${organizationId} not found`
      );
    }

    return organization;
  }

  /**
   * Create a new organization
   */
  async createOrganization(
    createOrganizationDto: CreateOrganizationDto,
    user: any
  ): Promise<Organization> {
    // Create the organization
    const createdOrganization = new this.organizationModel({
      ...createOrganizationDto,
      admin: user._id,
      staff: [user._id],
    });

    const savedOrg = await createdOrganization.save();

    // Check if the user has a pending role to be assigned
    const userMetadata = await this.userMetadataModel.findOne({
      userId: user._id,
    });
    const roleToAssign = userMetadata?.pendingOrgRole || 'owner'; // Default to owner

    // Find the role in the database
    const role = await this.roleModel.findOne({ id: roleToAssign });

    if (!role) {
      this.logger.warn(`Role ${roleToAssign} not found, assigning as owner`);
      const ownerRole = await this.roleModel.findOne({ id: 'owner' });

      await this.organizationRoleModel.create({
        userId: user._id,
        organizationId: savedOrg._id,
        roleId: ownerRole?.id as any,
        isPrimary: true,
      });
    } else {
      // Assign the pending role
      await this.organizationRoleModel.create({
        userId: user._id,
        organizationId: savedOrg._id,
        roleId: role.id,
        isPrimary: true,
      });
    }

    // Add organization role reference to user
    await this.userModel.findByIdAndUpdate(user._id, {
      $push: { organizationRoles: savedOrg._id },
    });

    // If the user created the organization via invitation, revoke the create_organization permission
    // to prevent them from creating multiple organizations without proper authorization
    if (userMetadata?.pendingOrgRole) {
      await this.authorizationService.revokeCustomPermission(
        user._id,
        'create_organization',
        { contextType: 'SYSTEM' }
      );

      // Clear the pending role
      await this.userMetadataModel.updateOne(
        { userId: user._id },
        {
          $unset: {
            pendingOrgRole: '',
            pendingOrgRoleGrantedAt: '',
            pendingOrgRoleGrantedBy: '',
          },
        }
      );
    }

    // Notify admins of new organization
    await this.notifyAdmins(
      savedOrg._id as any,
      'New Organization Created',
      `A new organization "${savedOrg.name}" has been created.`
    );

    return savedOrg;
  }

  /**
   * Update an organization
   */
  async updateOrganization(
    organizationId: Types.ObjectId,
    updateOrganizationDto: UpdateOrganizationDto
  ): Promise<Organization> {
    const updatedOrganization = await this.organizationModel
      .findByIdAndUpdate(organizationId, updateOrganizationDto, { new: true })
      .exec();

    if (!updatedOrganization) {
      throw new NotFoundException(
        `Organization with ID ${organizationId} not found`
      );
    }

    return updatedOrganization;
  }

  /**
   * Get the user's primary organization
   */
  async getMyOrganization(userId: Types.ObjectId): Promise<Organization> {
    // Find the primary organization role for the user
    const primaryRole = await this.organizationRoleModel
      .findOne({
        userId: userId, // Changed from 'user' to 'userId'
        isPrimary: true,
      })
      .exec();

    if (!primaryRole) {
      // If no primary role is found, get the first available role
      const anyRole = await this.organizationRoleModel
        .findOne({
          userId: userId, // Changed from 'user' to 'userId'
        })
        .exec();

      if (!anyRole) {
        throw new NotFoundException('No organization found for this user');
      }

      return this.getOrganization(anyRole.organizationId as any);
    }

    return this.getOrganization(primaryRole.organizationId as any);
  }
  /**
   * Request organization deletion
   */
  async requestOrganizationDeletion(
    organizationId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<Organization> {
    const organization = await this.organizationModel
      .findByIdAndUpdate(
        organizationId,
        {
          deletionRequested: true,
          deletionRequestedAt: new Date(),
          deletionRequestedBy: userId,
        },
        { new: true }
      )
      .exec();

    if (!organization) {
      throw new NotFoundException(
        `Organization with ID ${organizationId} not found`
      );
    }

    // Notify organization admins
    await this.notifyAdmins(
      organizationId,
      'Organization Deletion Requested',
      `A request to delete this organization has been submitted.`
    );

    return organization;
  }

  /**
   * Cancel organization deletion request
   */
  async cancelOrganizationDeletion(
    organizationId: Types.ObjectId
  ): Promise<Organization> {
    const organization = await this.organizationModel
      .findByIdAndUpdate(
        organizationId,
        {
          $unset: {
            deletionRequested: 1,
            deletionRequestedAt: 1,
            deletionRequestedBy: 1,
          },
        },
        { new: true }
      )
      .exec();

    if (!organization) {
      throw new NotFoundException(
        `Organization with ID ${organizationId} not found`
      );
    }

    // Notify organization admins
    await this.notifyAdmins(
      organizationId,
      'Organization Deletion Cancelled',
      `The request to delete this organization has been cancelled.`
    );

    return organization;
  }

  /**
   * Get a list of organizations
   */
  async getOrganizationsListing(
    userId: Types.ObjectId
  ): Promise<Organization[]> {
    // Get all organizations where the user has a role
    const userRoles = await this.organizationRoleModel
      .find({
        user: userId,
      })
      .exec();

    const organizationIds = userRoles.map((role) => role.organizationId);

    return this.organizationModel
      .find({
        _id: { $in: organizationIds },
      })
      .select('name type status logoUrl _id')
      .exec();
  }

  /**
   * Search organizations by name
   */
  async searchOrganizations(
    searchTerm: string,
    excludeType?: string
  ): Promise<Organization[]> {
    const regex = new RegExp(searchTerm, 'i');
    const query: any = { name: { $regex: regex } };

    if (excludeType) {
      query.type = { $ne: excludeType };
    }

    return this.organizationModel
      .find(query, { name: 1, type: 1, _id: 1, logoUrl: 1 })
      .exec();
  }

  /**
   * Get organization role hierarchy
   */
  async getOrganizationRoleHierarchy(
    organizationId: Types.ObjectId
  ): Promise<any> {
    // This method would return the role hierarchy for the organization
    // Typically, this would involve fetching roles and ordering them
    const roles = await this.organizationRoleModel
      .find({ organization: organizationId })
      .populate('roleId')
      .sort({ 'roleId.hierarchyLevel': 1 })
      .exec();
    // Transform to hierarchical structure based on ROLE_HIERARCHY
    const hierarchicalRoles = [...this.roleHierarchy]
      .map((roleName) => {
        const matchingRoles = roles.filter((r) => r.roleId === roleName);
        return {
          role: roleName,
          count: matchingRoles.length,
          users:
            matchingRoles.length > 0 ? matchingRoles.map((r) => r.userId) : [],
        };
      })
      .filter((r) => r.count > 0);

    return hierarchicalRoles;
  }

  /**
   * Set primary organization for a user
   */
  async setPrimaryOrganization(
    userId: Types.ObjectId,
    organizationId: Types.ObjectId
  ): Promise<OrganizationRole> {
    // First unset any existing primary roles
    await this.organizationRoleModel
      .updateMany({ user: userId, isPrimary: true }, { isPrimary: false })
      .exec();

    // Set the new primary role
    const updatedRole = await this.organizationRoleModel
      .findOneAndUpdate(
        { user: userId, organization: organizationId },
        { isPrimary: true },
        { new: true }
      )
      .exec();

    if (!updatedRole) {
      throw new NotFoundException(
        `User does not have a role in this organization`
      );
    }

    return updatedRole;
  }

  /**
   * Get user's highest and lowest roles across all organizations
   */
  async getUserHighestAndLowestRoles(
    userId: string
  ): Promise<HighestLowestRoles> {
    const user = await this.userModel
      .findById(userId)
      .populate({
        path: 'organizationRoles',
        populate: {
          path: 'organization',
          select: 'name type status logoUrl',
        },
      })
      .exec();

    if (
      !user ||
      !user.organizationRoles ||
      user.organizationRoles.length === 0
    ) {
      return {
        highest: {
          role: '',
          organization: null,
          permissions: [],
          staffType: '',
        },
        lowest: {
          role: '',
          organization: null,
          permissions: [],
          staffType: '',
        },
        primaryRole: {
          role: '',
          organization: null,
          permissions: [],
          staffType: '',
        },
        totalRoles: [],
      };
    }

    const roles = user.organizationRoles as any[];
    return this.getHighestAndLowestRoles(roles);
  }

  /**
   * Get user's highest and lowest roles by email
   */
  async getUserHighestAndLowestRolesByEmail(
    email: string
  ): Promise<HighestLowestRoles> {
    try {
      const user = await this.userModel
        .findOne({ email })
        .populate({
          path: 'organizationRoles',
          populate: {
            path: 'organization',
            select: 'name type status logoUrl',
          },
        })
        .exec();

      if (
        !user ||
        !user.organizationRoles ||
        user.organizationRoles.length === 0
      ) {
        return {
          highest: {
            role: '',
            organization: null,
            permissions: [],
            staffType: '',
          },
          lowest: {
            role: '',
            organization: null,
            permissions: [],
            staffType: '',
          },
          primaryRole: {
            role: '',
            organization: null,
            permissions: [],
            staffType: '',
          },
        };
      }

      const roles = user.organizationRoles as any[];
      return this.getHighestAndLowestRoles(roles);
    } catch (error: any) {
      this.logger.error(
        `Error in getUserHighestAndLowestRolesByEmail: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Helper method to determine highest and lowest roles
   */
  private async getHighestAndLowestRoles(
    roleObjs: any[]
  ): Promise<HighestLowestRoles> {
    if (roleObjs.length === 0) {
      return {
        highest: { role: '', organization: null, permissions: [] },
        lowest: { role: '', organization: null, permissions: [] },
        primaryRole: { role: '', organization: null, permissions: [] },
        totalRoles: [],
      };
    }

    // Ensure roles are populated with their Role object data
    const populatedRoles = await Promise.all(
      roleObjs.map(async (roleObj) => {
        // If not already populated, populate the role information
        if (typeof roleObj.roleId === 'string') {
          const role = await this.roleModel.findOne({ id: roleObj.roleId });
          return { ...roleObj, role };
        }
        return roleObj;
      })
    );

    let highest = populatedRoles[0];
    let lowest = populatedRoles[0];
    let primaryRole = null;

    // Find primary role and highest/lowest based on hierarchyLevel
    for (const roleObj of populatedRoles) {
      if (roleObj.isPrimary) {
        primaryRole = roleObj;
      }

      // Lower hierarchyLevel = higher authority
      if (roleObj.role.hierarchyLevel < highest.role.hierarchyLevel) {
        highest = roleObj;
      }

      if (roleObj.role.hierarchyLevel > lowest.role.hierarchyLevel) {
        lowest = roleObj;
      }
    }

    // If no primary role was found, use the highest role as primary
    if (!primaryRole && highest) {
      primaryRole = highest;
    }

    // Format return object to match expected interface
    return {
      highest: {
        role: highest.roleId,
        organization: highest.organization,
        permissions: [], // Permissions should come from RolePermission query
        staffType: highest.role.contextType,
        isPrimary: highest.isPrimary,
      },
      lowest: {
        role: lowest.roleId,
        organization: lowest.organization,
        permissions: [],
        staffType: lowest.role.contextType,
        isPrimary: lowest.isPrimary,
      },
      primaryRole: primaryRole
        ? {
            role: primaryRole.roleId,
            organization: primaryRole.organization,
            permissions: [],
            staffType: primaryRole.role.contextType,
          }
        : highest
        ? {
            role: highest.roleId,
            organization: highest.organization,
            permissions: [],
            staffType: highest.role.contextType,
          }
        : { role: '', organization: null, permissions: [] },
      totalRoles: populatedRoles.map((r) => ({
        role: r.roleId,
        organization: r.organization,
        permissions: [],
        staffType: r.role.contextType,
        isPrimary: r.isPrimary,
      })),
    };
  }

  /**
   * Helper method to get role rank in hierarchy
   */
  private async getRoleRank(roleId: string): Promise<number> {
    const role = await this.roleModel.findOne({ id: roleId });
    return role ? role.hierarchyLevel : -1;
  }

  /**
   * Notify organization admins
   */
  private async notifyAdmins(
    organizationId: Types.ObjectId,
    title: string,
    body: string
  ): Promise<void> {
    try {
      // Get all admin roles for the organization
      const adminRoles = await this.organizationRoleModel
        .find({
          organization: organizationId,
          role: 'admin',
        })
        .populate('user')
        .exec();

      if (adminRoles.length === 0) {
        this.logger.warn(`No admins found for organization ${organizationId}`);
        return;
      }

      // Get admin user IDs and emails
      const adminIds = adminRoles.map((role: any) => role.user['_id']);
      const adminEmails = adminRoles.map((role: any) => role.user['email']);

      // Send email notifications
      for (const email of adminEmails) {
        await this.emailService.sendEmail({
          to: email,
          subject: title,
          html: `<p>${body}</p>`,
        });
      }

      // Send push notifications (if applicable)
      await this.notificationService.sendNotification(adminIds, title, body, {
        organizationId: organizationId.toString(),
      });
    } catch (error: any) {
      this.logger.error(
        `Error notifying admins: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Validate user's access to an organization
   */
  async validateUserOrganizationAccess(
    userId: Types.ObjectId,
    organizationId: Types.ObjectId
  ): Promise<boolean> {
    const role = await this.organizationRoleModel
      .findOne({
        user: userId,
        organization: organizationId,
      })
      .exec();

    return !!role;
  }
}

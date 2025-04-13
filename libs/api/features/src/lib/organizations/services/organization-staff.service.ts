import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Organization,
  OrganizationDocument,
} from '../schemas/organization.schema';
import {
  OrganizationRole,
  OrganizationRoleDocument,
} from '../../authorization/schemas/organization-role.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { Role, RoleDocument } from '../../authorization/schemas/role.schema';
import { EmailService } from 'libs/shared/utils/src/lib/services/email.service';
import { AuthorizationService } from '../../authorization/services/authorization.service';
import { AddUserToOrganizationDto } from '../dto/add-user-to-organization.dto';
import { RemoveUserFromOrganizationDto } from '../dto/remove-user-from-organization.dto';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';
import { NotificationService } from 'libs/shared/utils/src/lib/services/notification.service';

@Injectable()
export class OrganizationStaffService {
  private readonly logger = new Logger(OrganizationStaffService.name);

  constructor(
    @InjectModel(Organization.name)
    private organizationModel: Model<OrganizationDocument>,
    @InjectModel(OrganizationRole.name)
    private organizationRoleModel: Model<OrganizationRoleDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    private emailService: EmailService,
    private notificationService: NotificationService,
    private authorizationService: AuthorizationService
  ) {}

  /**
   * Add a user to an organization
   */
  async addUserToOrganization(
    addUserDto: AddUserToOrganizationDto,
    adminUserId: Types.ObjectId
  ): Promise<OrganizationRole> {
    // Check if user exists by email or ID
    const user = addUserDto.userId
      ? await this.userModel.findById(addUserDto.userId).exec()
      : await this.userModel.findOne({ email: addUserDto.email }).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if organization exists
    const organization = await this.organizationModel
      .findById(addUserDto.organizationId)
      .exec();

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if user is already in the organization
    const existingRole = await this.organizationRoleModel
      .findOne({
        userId: user._id as any,
        organizationId: addUserDto.organizationId,
      })
      .exec();

    if (existingRole) {
      throw new BadRequestException(
        'User is already a member of this organization'
      );
    }

    // Get role from database
    const role = await this.roleModel.findOne({ id: addUserDto.role }).exec();

    if (!role) {
      throw new NotFoundException(`Role '${addUserDto.role}' not found`);
    }

    // Create organization role for user
    const orgRole = new this.organizationRoleModel({
      userId: user._id as any,
      organizationId: addUserDto.organizationId,
      roleId: addUserDto.role,
      isPrimary: false,
      isActive: true,
      assignedById: adminUserId,
      assignedAt: new Date(),
    });

    // Execute operations in parallel
    await Promise.all([
      // Save the organization role
      orgRole.save(),

      // Add user to organization staff list
      this.organizationModel.findByIdAndUpdate(addUserDto.organizationId, {
        $push: { staff: user._id },
      }),
    ]);

    // Send notifications
    try {
      // Notify organization admins
      await this.notifyAdmins(
        addUserDto.organizationId,
        'New User Added',
        `${user.firstName} ${user.lastName} has been added to the organization with the role of ${role.name}.`,
        adminUserId
      );

      // Notify the user
      await this.notifyUser(
        user._id as any,
        'Added to Organization',
        `You have been added to ${organization.name} with the role of ${role.name}.`,
        organization.name
      );
    } catch (error: any) {
      this.logger.error(
        `Error sending notifications: ${error.message}`,
        error.stack
      );
    }

    return orgRole;
  }

  /**
   * Get all staff members of an organization
   */
  async getOrganizationStaff(organizationId: Types.ObjectId): Promise<User[]> {
    const organization = await this.organizationModel
      .findById(organizationId)
      .populate('staff')
      .exec();

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization.staff as any[];
  }

  /**
   * Get all organizations for a user
   */
  async getOrganizationsByUser(
    userId: Types.ObjectId
  ): Promise<Organization[]> {
    // Find all organization roles for this user
    const organizationRoles = await this.organizationRoleModel
      .find({
        userId,
        isActive: true,
      })
      .exec();

    if (!organizationRoles || organizationRoles.length === 0) {
      return [];
    }

    // Get all organization IDs
    const organizationIds = organizationRoles.map(
      (role) => role.organizationId
    );

    // Fetch all organizations
    const organizations = await this.organizationModel
      .find({ _id: { $in: organizationIds } })
      .exec();

    return organizations;
  }

  /**
   * Get a user's role in an organization
   */
  async getOrganizationRole(
    userId: Types.ObjectId,
    organizationId: Types.ObjectId
  ): Promise<OrganizationRole> {
    const role = await this.organizationRoleModel
      .findOne({
        userId,
        organizationId,
        isActive: true,
      })
      .exec();

    if (!role) {
      throw new NotFoundException(
        'User does not have a role in this organization'
      );
    }

    return role;
  }

  /**
   * Update a user's role in an organization
   */
  async updateUserRole(
    updateRoleDto: UpdateUserRoleDto,
    adminUserId: Types.ObjectId
  ): Promise<OrganizationRole> {
    // Check if user and organization exist
    const [user, organization, role] = await Promise.all([
      this.userModel.findById(updateRoleDto.userId).exec(),
      this.organizationModel.findById(updateRoleDto.organizationId).exec(),
      this.roleModel.findOne({ id: updateRoleDto.role }).exec(),
    ]);

    if (!user || !organization) {
      throw new NotFoundException('User or organization not found');
    }

    if (!role) {
      throw new NotFoundException(`Role '${updateRoleDto.role}' not found`);
    }

    // Update the role
    const updatedRole = await this.organizationRoleModel
      .findOneAndUpdate(
        {
          userId: updateRoleDto.userId,
          organizationId: updateRoleDto.organizationId,
          isActive: true,
        },
        {
          roleId: updateRoleDto.role,
        },
        { new: true }
      )
      .exec();

    if (!updatedRole) {
      throw new NotFoundException('User role in organization not found');
    }

    // Notify about the role change
    try {
      // Notify organization admins
      await this.notifyAdmins(
        updateRoleDto.organizationId,
        'User Role Updated',
        `${user.firstName} ${user.lastName}'s role has been updated to ${role.name} in ${organization.name}.`,
        adminUserId
      );

      // Notify the user
      await this.notifyUser(
        user._id as any,
        'Your Role Updated',
        `Your role in ${organization.name} has been updated to ${role.name}.`
      );
    } catch (error: any) {
      this.logger.error(
        `Error sending notifications: ${error.message}`,
        error.stack
      );
    }

    return updatedRole;
  }

  /**
   * Remove a user from an organization
   */
  async removeUserFromOrganization(
    removeUserDto: RemoveUserFromOrganizationDto,
    adminUserId: Types.ObjectId
  ): Promise<void> {
    // Check if user and organization exist
    const [user, organization] = await Promise.all([
      this.userModel.findById(removeUserDto.userId).exec(),
      this.organizationModel.findById(removeUserDto.organizationId).exec(),
    ]);

    if (!user || !organization) {
      throw new NotFoundException('User or organization not found');
    }

    // Get organization role
    const orgRole = await this.organizationRoleModel
      .findOne({
        userId: removeUserDto.userId,
        organizationId: removeUserDto.organizationId,
        isActive: true,
      })
      .exec();

    if (!orgRole) {
      throw new NotFoundException('User is not a member of this organization');
    }

    // Execute operations in parallel
    await Promise.all([
      // Deactivate the organization role instead of deleting it
      this.organizationRoleModel.findByIdAndUpdate(orgRole._id, {
        isActive: false,
        activeTo: new Date(),
      }),

      // Remove user from organization staff list
      this.organizationModel.findByIdAndUpdate(removeUserDto.organizationId, {
        $pull: { staff: removeUserDto.userId },
      }),
    ]);

    // Notify about the removal
    try {
      // Notify organization admins
      await this.notifyAdmins(
        removeUserDto.organizationId,
        'User Removed',
        `${user.firstName} ${user.lastName} has been removed from ${organization.name}.`,
        adminUserId
      );

      // Notify the user
      await this.notifyUser(
        user._id as any,
        'Removed from Organization',
        `You have been removed from ${organization.name}.`
      );
    } catch (error: any) {
      this.logger.error(
        `Error sending notifications: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Get care staff for an organization
   */
  async getCareStaff(
    organizationId: Types.ObjectId
  ): Promise<OrganizationRole[]> {
    // Get roles that are considered "care" roles
    const careRoles = await this.roleModel
      .find({
        contextType: 'ORGANIZATION',
        hierarchyLevel: { $gte: 4 }, // Assuming care roles have a hierarchy level of 4 or greater
      })
      .exec();

    const careRoleIds = careRoles.map((role) => role.id);

    return this.organizationRoleModel
      .find({
        organizationId,
        roleId: { $in: careRoleIds },
        isActive: true,
      })
      .populate('userId')
      .exec();
  }

  /**
   * Get admin staff for an organization
   */
  async getAdminStaff(
    organizationId: Types.ObjectId
  ): Promise<OrganizationRole[]> {
    // Get roles that are considered "admin" roles
    const adminRoles = await this.roleModel
      .find({
        contextType: 'ORGANIZATION',
        hierarchyLevel: { $lte: 3 }, // Assuming admin roles have a hierarchy level of 3 or less
      })
      .exec();

    const adminRoleIds = adminRoles.map((role) => role.id);

    return this.organizationRoleModel
      .find({
        organizationId,
        roleId: { $in: adminRoleIds },
        isActive: true,
      })
      .populate('userId')
      .exec();
  }

  /**
   * Notify organization admins
   */
  private async notifyAdmins(
    organizationId: Types.ObjectId | string,
    title: string,
    body: string,
    excludeUserId?: Types.ObjectId
  ): Promise<void> {
    try {
      // Find admin roles in the database
      const adminRoles = await this.roleModel
        .find({
          contextType: 'ORGANIZATION',
          hierarchyLevel: { $lte: 2 }, // owner and admin roles
        })
        .exec();

      const adminRoleIds = adminRoles.map((role) => role.id);

      // Get all admin roles for the organization
      const query: any = {
        organizationId,
        roleId: { $in: adminRoleIds },
        isActive: true,
      };

      if (excludeUserId) {
        query.userId = { $ne: excludeUserId };
      }

      const orgAdminRoles = await this.organizationRoleModel
        .find(query)
        .populate('userId')
        .exec();

      if (orgAdminRoles.length === 0) {
        return;
      }

      // Get admin user IDs and emails
      const adminUserIds = [];
      const adminEmails = [];

      for (const role of orgAdminRoles) {
        const user = role.userId as any;
        if (user && user.email) {
          adminUserIds.push(user._id);
          adminEmails.push(user.email);
        }
      }

      // Send email notifications
      for (const email of adminEmails) {
        await this.emailService.sendEmail({
          to: email,
          subject: title,
          html: `<p>${body}</p>`,
        });
      }

      // Send push notifications
      await this.notificationService.sendNotification(
        adminUserIds,
        title,
        body,
        { organizationId: organizationId.toString() }
      );
    } catch (error: any) {
      this.logger.error(
        `Error notifying admins: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Notify a specific user
   */
  private async notifyUser(
    userId: Types.ObjectId,
    title: string,
    body: string,
    organizationName?: string
  ): Promise<void> {
    try {
      const user = await this.userModel.findById(userId).exec();

      if (!user) {
        return;
      }

      // Send email notification
      await this.emailService.sendEmail({
        to: user.email,
        subject: title,
        html: `<p>${body}</p>`,
      });

      // Send push notification
      await this.notificationService.sendNotification(
        [userId],
        title,
        body,
        organizationName ? { organizationName } : undefined
      );
    } catch (error: any) {
      this.logger.error(`Error notifying user: ${error.message}`, error.stack);
    }
  }
}

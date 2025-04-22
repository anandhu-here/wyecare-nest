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
  CreateLinkInvitationDto,
  InvitationType,
} from '../dto/create-link-invitation.dto';

import { User, UserDocument } from '../../users/schemas/user.schema';
import { EmailService } from 'libs/shared/utils/src/lib/services/email.service';
import { LinkOrganizationsDto } from '../dto/link-organizations.dto';
import { UnlinkOrganizationsDto } from '../dto/unlink-organizations.dto';
import { RespondToLinkInvitationDto } from '../dto/respond-to-link-invitation.dto';
import {
  OrganizationRole,
  OrganizationRoleDocument,
} from '../../authorization/schemas/organization-role.schema';
import { NotificationService } from 'libs/shared/utils/src/lib/services/notification.service';
import {
  OrganizationLink,
  OrganizationLinkDocument,
} from '../schemas/organization.link.schema';
import {
  LinkInvitation,
  LinkInvitationDocument,
} from '../schemas/link.invitation';
import { Role, RoleDocument } from '../../authorization/schemas/role.schema';
import {
  AcceptLinkDto,
  CreateLinkTokenDto,
  VerifyLinkTokenDto,
} from '../dto/token-link.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class OrganizationLinkingService {
  private readonly logger = new Logger(OrganizationLinkingService.name);

  constructor(
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(Organization.name)
    private organizationModel: Model<OrganizationDocument>,
    @InjectModel(OrganizationLink.name)
    private organizationLinkModel: Model<OrganizationLinkDocument>,
    @InjectModel(LinkInvitation.name)
    private linkInvitationModel: Model<LinkInvitationDocument>,
    @InjectModel(OrganizationRole.name)
    private organizationRoleModel: Model<OrganizationRoleDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private emailService: EmailService,
    private notificationService: NotificationService,
    private jwtService: JwtService
  ) {}

  /**
   * Link two organizations
   */
  async linkOrganizations(
    linkOrganizationsDto: LinkOrganizationsDto,
    userId: Types.ObjectId
  ): Promise<OrganizationLink> {
    // Check if both organizations exist
    const [sourceOrg, targetOrg] = await Promise.all([
      this.organizationModel
        .findById(linkOrganizationsDto.sourceOrganizationId)
        .exec(),
      this.organizationModel
        .findById(linkOrganizationsDto.targetOrganizationId)
        .exec(),
    ]);

    if (!sourceOrg || !targetOrg) {
      throw new NotFoundException('One or both organizations not found');
    }

    // Check if organizations are already linked
    const existingLink = await this.organizationLinkModel
      .findOne({
        $or: [
          {
            sourceOrganization: linkOrganizationsDto.sourceOrganizationId,
            targetOrganization: linkOrganizationsDto.targetOrganizationId,
          },
          {
            sourceOrganization: linkOrganizationsDto.targetOrganizationId,
            targetOrganization: linkOrganizationsDto.sourceOrganizationId,
          },
        ],
      })
      .exec();

    if (existingLink) {
      throw new BadRequestException('Organizations are already linked');
    }

    // Create the link
    const link = new this.organizationLinkModel({
      sourceOrganization: linkOrganizationsDto.sourceOrganizationId,
      targetOrganization: linkOrganizationsDto.targetOrganizationId,
      linkType: linkOrganizationsDto.linkType || 'default',
      notes: linkOrganizationsDto.notes,
      createdBy: userId,
    });

    // Execute operations in parallel
    await Promise.all([
      // Save the link
      link.save(),

      // Update both organizations
      this.organizationModel.findByIdAndUpdate(
        linkOrganizationsDto.sourceOrganizationId,
        {
          $addToSet: {
            linkedOrganizations: linkOrganizationsDto.targetOrganizationId,
          },
        }
      ),
      this.organizationModel.findByIdAndUpdate(
        linkOrganizationsDto.targetOrganizationId,
        {
          $addToSet: {
            linkedOrganizations: linkOrganizationsDto.sourceOrganizationId,
          },
        }
      ),
    ]);

    // Notify both organizations
    try {
      await Promise.all([
        this.notifyAdmins(
          linkOrganizationsDto.sourceOrganizationId,
          'Organizations Linked',
          `Your organization has been linked with ${targetOrg.name}.`
        ),
        this.notifyAdmins(
          linkOrganizationsDto.targetOrganizationId,
          'Organizations Linked',
          `Your organization has been linked with ${sourceOrg.name}.`
        ),
      ]);
    } catch (error: any) {
      this.logger.error(
        `Error notifying about organization linking: ${error.message}`,
        error.stack
      );
    }

    return link;
  }

  async findOrganizationsByEmail(
    email: string,
    currentOrgId: Types.ObjectId
  ): Promise<Organization[]> {
    // Find organizations with matching email (excluding current org)
    const orgsByDirectEmail = await this.organizationModel
      .find({
        email: { $regex: new RegExp(email, 'i') }, // Case-insensitive search
        _id: { $ne: currentOrgId }, // Exclude current organization
      })
      .select('_id name email type logoUrl')
      .exec();

    // Find organizations with admins/owners having the email
    const adminRoles = await this.organizationRoleModel
      .find({
        organizationId: { $ne: currentOrgId }, // Exclude current organization
        roleId: { $in: ['ORGANIZATION_ADMIN', 'ORGANIZATION_OWNER'] },
      })
      .populate('userId', 'email')
      .populate('organizationId', '_id name email type logoUrl')
      .exec();

    // Filter admin roles where user email matches search
    const orgsByAdminEmail = adminRoles
      .filter((role: any) => {
        const user = role.userId as any;
        return (
          user.email && user.email.toLowerCase().includes(email.toLowerCase())
        );
      })
      .map((role: any) => role.organizationId);

    // Combine results, removing duplicates
    const allOrgs = [...orgsByDirectEmail];

    // Add orgs found by admin email only if not already included
    orgsByAdminEmail.forEach((org: any) => {
      const isDuplicate = allOrgs.some(
        (existingOrg: any) => existingOrg._id.toString() === org._id.toString()
      );

      if (!isDuplicate) {
        allOrgs.push(org);
      }
    });

    return allOrgs;
  }

  /**
   * Unlink two organizations
   */
  async unlinkOrganizations(
    unlinkOrganizationsDto: UnlinkOrganizationsDto,
    userId: Types.ObjectId
  ): Promise<void> {
    // Check if both organizations exist
    const [sourceOrg, targetOrg] = await Promise.all([
      this.organizationModel
        .findById(unlinkOrganizationsDto.sourceOrganizationId)
        .exec(),
      this.organizationModel
        .findById(unlinkOrganizationsDto.targetOrganizationId)
        .exec(),
    ]);

    if (!sourceOrg || !targetOrg) {
      throw new NotFoundException('One or both organizations not found');
    }

    // Delete the link
    await this.organizationLinkModel
      .findOneAndDelete({
        $or: [
          {
            sourceOrganization: unlinkOrganizationsDto.sourceOrganizationId,
            targetOrganization: unlinkOrganizationsDto.targetOrganizationId,
          },
          {
            sourceOrganization: unlinkOrganizationsDto.targetOrganizationId,
            targetOrganization: unlinkOrganizationsDto.sourceOrganizationId,
          },
        ],
      })
      .exec();

    // Update both organizations
    await Promise.all([
      this.organizationModel.findByIdAndUpdate(
        unlinkOrganizationsDto.sourceOrganizationId,
        {
          $pull: {
            linkedOrganizations: unlinkOrganizationsDto.targetOrganizationId,
          },
        }
      ),
      this.organizationModel.findByIdAndUpdate(
        unlinkOrganizationsDto.targetOrganizationId,
        {
          $pull: {
            linkedOrganizations: unlinkOrganizationsDto.sourceOrganizationId,
          },
        }
      ),
    ]);

    // Notify both organizations
    try {
      await Promise.all([
        this.notifyAdmins(
          unlinkOrganizationsDto.sourceOrganizationId,
          'Organizations Unlinked',
          `Your organization has been unlinked from ${targetOrg.name}.`
        ),
        this.notifyAdmins(
          unlinkOrganizationsDto.targetOrganizationId,
          'Organizations Unlinked',
          `Your organization has been unlinked from ${sourceOrg.name}.`
        ),
      ]);
    } catch (error: any) {
      this.logger.error(
        `Error notifying about organization unlinking: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Get linked organizations
   */
  async getLinkedOrganizations(
    organizationId: Types.ObjectId,
    type?: string
  ): Promise<Organization[]> {
    try {
      const organization = await this.organizationModel
        .findById(organizationId)
        .populate({
          path: 'linkedOrganizations',
          select: 'name email type status logoUrl _id address',
        })
        .exec();

      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      let linkedOrganizations = organization.linkedOrganizations as any[];

      if (type) {
        linkedOrganizations = linkedOrganizations.filter(
          (org: any) => org.type === type
        );
      }

      return linkedOrganizations;
    } catch (error: any) {
      this.logger.error(
        `Error in getLinkedOrganizations: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get linked organizations with pagination
   */
  async getLinkedOrganizationsPaginated(
    organizationId: Types.ObjectId,
    page: number = 1,
    limit: number = 10,
    type?: string
  ): Promise<any> {
    try {
      const linkedOrganizations = await this.getLinkedOrganizations(
        organizationId,
        type
      );

      // Calculate pagination
      const total = linkedOrganizations.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const paginatedData = linkedOrganizations.slice(
        startIndex,
        startIndex + limit
      );

      return {
        data: paginatedData,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error: any) {
      this.logger.error(
        `Error in getLinkedOrganizationsPaginated: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get a linked organization by ID
   */
  async getLinkedOrganizationById(
    currentOrganizationId: Types.ObjectId,
    linkedOrganizationId: Types.ObjectId
  ): Promise<Organization> {
    // Check if organizations are linked
    const organization = await this.organizationModel
      .findById(currentOrganizationId)
      .exec();

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const isLinked = organization.linkedOrganizations?.some(
      (org: any) => org.toString() === linkedOrganizationId.toString()
    );

    if (!isLinked) {
      throw new NotFoundException('Organizations are not linked');
    }

    // Get the linked organization
    const linkedOrganization = await this.organizationModel
      .findById(linkedOrganizationId)
      .select('name email type status logoUrl _id address')
      .exec();

    if (!linkedOrganization) {
      throw new NotFoundException('Linked organization not found');
    }

    return linkedOrganization;
  }

  /**
   * Get admins of linked organizations
   */
  async getLinkedOrganizationAdmin(
    organizationId: Types.ObjectId
  ): Promise<any[]> {
    try {
      // Get linked organizations
      const linkedOrgs = await this.getLinkedOrganizations(organizationId);
      const linkedOrgIds = linkedOrgs.map(
        (org: any) => new Types.ObjectId(org._id.toString())
      );

      // Get admin roles for linked organizations
      const adminRoles = await this.organizationRoleModel
        .find({
          organizationId: { $in: linkedOrgIds },
          roleId: { $in: ['ORGANIZATION_ADMIN', 'ORGANIZATION_OWNER'] }, // Use your actual role IDs
        })
        .populate('userId', 'firstName lastName email _id')
        .populate('organizationId', 'name _id')
        .exec();

      return adminRoles.map((role) => ({
        user: role.userId,
        organization: role.organizationId,
      }));
    } catch (error: any) {
      this.logger.error(
        `Error in getLinkedOrganizationAdmin: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get admins of linked organizations for a specific carer
   */
  async getLinkedOrganizationAdminForCarer(
    organizationId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<any[]> {
    const linkedOrgs = await this.getLinkedOrganizations(organizationId);
    const linkedOrgIds = linkedOrgs.map(
      (org: any) => new Types.ObjectId(org._id.toString())
    );
    // Get the carer's organization
    const userOrg = await this.organizationModel
      .findById(organizationId)
      .exec();

    if (!userOrg) {
      throw new NotFoundException('Organization not found');
    }

    // Get admin roles in this organization
    const adminRoles = await this.organizationRoleModel
      .find({
        organizationId: { $in: linkedOrgIds },
        roleId: { $in: ['ORGANIZATION_ADMIN', 'ORGANIZATION_OWNER'] }, // Use your actual role IDs
      })
      .populate('userId', 'firstName lastName email _id')
      .populate('organizationId', 'name _id')
      .exec();

    return adminRoles.map((role) => ({
      user: role.userId,
      organization: role.organizationId,
    }));
  }

  async sendLinkInvitation(
    sourceOrgId: Types.ObjectId,
    targetOrgId: Types.ObjectId,
    token: string,
    message?: string
  ): Promise<void> {
    // Get source organization details
    const sourceOrg = await this.organizationModel.findById(sourceOrgId);
    if (!sourceOrg) {
      throw new NotFoundException('Source organization not found');
    }

    // Get target organization details
    const targetOrg = await this.organizationModel.findById(targetOrgId);
    if (!targetOrg) {
      throw new NotFoundException('Target organization not found');
    }

    // Create the frontend URL that can be shared
    const baseUrl = process.env['FRONTEND_URL'] || 'https://yourdomain.com';
    const linkUrl = `${baseUrl}/dashboard/organizations/link?token=${token}`;

    // Notify admins of the target organization
    const title = 'Organization Link Invitation';
    const body = `
    <h2>Organization Link Invitation</h2>
    <p>${sourceOrg.name} has invited your organization to link with them.</p>
    <p>${message || ''}</p>
    <p>Click the following link to accept this invitation:</p>
    <p><a href="${linkUrl}">${linkUrl}</a></p>
  `;

    console.log(targetOrgId, 'targetOrgId');

    await this.notifyAdmins(targetOrgId, title, body);
  }

  async createLinkToken(
    createLinkTokenDto: CreateLinkTokenDto,
    userId: Types.ObjectId
  ): Promise<{ token: string; expiresAt: Date }> {
    const {
      sourceOrganizationId,
      linkType,
      message,
      expiresIn = '7d',
    } = createLinkTokenDto;

    // Verify that source organization exists
    const organization = await this.organizationModel.findById(
      sourceOrganizationId
    );
    if (!organization) {
      throw new NotFoundException('Source organization not found');
    }

    // Get expiration time
    const expiresInMs = this.parseDuration(expiresIn);
    const expiresAt = new Date(Date.now() + expiresInMs);

    // Create token payload
    const payload = {
      sourceOrganizationId: sourceOrganizationId.toString(),
      sourceOrganizationName: organization.name,
      linkType: linkType || 'default',
      message: message || '',
      createdBy: userId.toString(),
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    // Generate JWT token
    const token = this.jwtService.sign(payload, {
      expiresIn,
      secret: process.env['JWT_LINK_TOKEN_SECRET'] || process.env['JWT_SECRET'],
    });

    return { token, expiresAt };
  }

  /**
   * Verify a link token without accepting the link
   */
  async verifyLinkToken(verifyLinkTokenDto: VerifyLinkTokenDto): Promise<any> {
    try {
      // Verify the token
      const payload = this.jwtService.verify(verifyLinkTokenDto.token, {
        secret:
          process.env['JWT_LINK_TOKEN_SECRET'] || process.env['JWT_SECRET'],
      });

      // Check if token is expired
      if (new Date(payload.expiresAt) < new Date()) {
        throw new BadRequestException('Link token has expired');
      }

      // Get source organization details
      const sourceOrg = await this.organizationModel.findById(
        payload.sourceOrganizationId
      );
      if (!sourceOrg) {
        throw new NotFoundException('Source organization not found');
      }

      return {
        valid: true,
        sourceOrganization: {
          id: sourceOrg._id,
          name: sourceOrg.name,
          type: sourceOrg.type,
        },
        linkType: payload.linkType,
        message: payload.message,
        expiresAt: payload.expiresAt,
      };
    } catch (error: any) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      // Handle JWT verification errors
      this.logger.error(
        `Error verifying link token: ${error.message}`,
        error.stack
      );
      throw new BadRequestException('Invalid or expired link token');
    }
  }

  /**
   * Accept a link using the token
   */
  async acceptLink(
    acceptLinkDto: AcceptLinkDto,
    userId: Types.ObjectId
  ): Promise<OrganizationLink> {
    try {
      // Verify the token first
      const tokenInfo = await this.verifyLinkToken({
        token: acceptLinkDto.token,
      });

      // Check if target organization exists
      const targetOrg = await this.organizationModel.findById(
        acceptLinkDto.targetOrganizationId
      );
      if (!targetOrg) {
        throw new NotFoundException('Target organization not found');
      }

      // Check if organizations are already linked
      const existingLink = await this.organizationLinkModel
        .findOne({
          $or: [
            {
              sourceOrganization: tokenInfo.sourceOrganization.id,
              targetOrganization: acceptLinkDto.targetOrganizationId,
            },
            {
              sourceOrganization: acceptLinkDto.targetOrganizationId,
              targetOrganization: tokenInfo.sourceOrganization.id,
            },
          ],
        })
        .exec();

      if (existingLink) {
        throw new BadRequestException('Organizations are already linked');
      }

      // Create the link
      const link = new this.organizationLinkModel({
        sourceOrganization: tokenInfo.sourceOrganization.id,
        targetOrganization: acceptLinkDto.targetOrganizationId,
        linkType: tokenInfo.linkType,
        notes: tokenInfo.message,
        createdBy: userId,
      });

      // Execute operations in parallel
      await Promise.all([
        // Save the link
        link.save(),

        // Update both organizations
        this.organizationModel.findByIdAndUpdate(
          tokenInfo.sourceOrganization.id,
          {
            $addToSet: {
              linkedOrganizations: acceptLinkDto.targetOrganizationId,
            },
          }
        ),
        this.organizationModel.findByIdAndUpdate(
          acceptLinkDto.targetOrganizationId,
          {
            $addToSet: {
              linkedOrganizations: tokenInfo.sourceOrganization.id,
            },
          }
        ),
      ]);

      // Notify both organizations
      try {
        await this.notifyAdmins(
          tokenInfo.sourceOrganization.id,
          'Organizations Linked',
          `Your organization has been linked with ${targetOrg.name}.`
        );

        await this.notifyAdmins(
          acceptLinkDto.targetOrganizationId,
          'Organizations Linked',
          `Your organization has been linked with ${tokenInfo.sourceOrganization.name}.`
        );
      } catch (error: any) {
        this.logger.error(
          `Error notifying about organization linking: ${error.message}`,
          error.stack
        );
      }

      return link;
    } catch (error: any) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(`Error accepting link: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to process link acceptance');
    }
  }

  /**
   * Helper to parse duration string to milliseconds
   */
  private parseDuration(duration: string): number {
    const unit = duration.charAt(duration.length - 1);
    const value = parseInt(duration.slice(0, -1));

    switch (unit) {
      case 'h': // hours
        return value * 60 * 60 * 1000;
      case 'd': // days
        return value * 24 * 60 * 60 * 1000;
      case 'w': // weeks
        return value * 7 * 24 * 60 * 60 * 1000;
      default:
        throw new BadRequestException('Invalid duration format');
    }
  }

  /**
   * Create a link invitation
   */
  async createLinkInvitation(
    createLinkInvitationDto: CreateLinkInvitationDto,
    userId: Types.ObjectId,
    sourceOrgId: Types.ObjectId
  ): Promise<LinkInvitation> {
    // Validate source organization

    // Create invitation based on type
    if (createLinkInvitationDto.invitationType === InvitationType.DIRECT) {
      // Direct invitation to an organization
      if (!createLinkInvitationDto.targetOrganizationId) {
        throw new BadRequestException(
          'Target organization ID is required for direct invitations'
        );
      }

      // Check if both organizations exist
      const [sourceOrg, targetOrg] = await Promise.all([
        this.organizationModel
          .findById(createLinkInvitationDto.sourceOrganizationId)
          .exec(),
        this.organizationModel
          .findById(createLinkInvitationDto.targetOrganizationId)
          .exec(),
      ]);

      if (!sourceOrg || !targetOrg) {
        throw new NotFoundException('One or both organizations not found');
      }

      // Check if they're already linked
      const isLinked = sourceOrg.linkedOrganizations?.some(
        (org: any) =>
          org.toString() === createLinkInvitationDto.targetOrganizationId
      );

      if (isLinked) {
        throw new BadRequestException('Organizations are already linked');
      }

      // Check for existing invitation
      const existingInvitation = await this.linkInvitationModel
        .findOne({
          sourceOrganization: createLinkInvitationDto.sourceOrganizationId,
          targetOrganization: createLinkInvitationDto.targetOrganizationId,
          status: 'pending',
        })
        .exec();

      if (existingInvitation) {
        throw new BadRequestException(
          'An invitation already exists for these organizations'
        );
      }

      // Create the invitation
      const invitation = new this.linkInvitationModel({
        sourceOrganization: createLinkInvitationDto.sourceOrganizationId,
        targetOrganization: createLinkInvitationDto.targetOrganizationId,
        message: createLinkInvitationDto.message,
        linkType: createLinkInvitationDto.linkType || 'default',
        createdBy: userId,
      });

      await invitation.save();

      // Notify target organization
      await this.notifyAdmins(
        createLinkInvitationDto.targetOrganizationId,
        'New Link Invitation',
        `${sourceOrg.name} has sent a link invitation to your organization.`
      );

      return invitation;
    } else {
      // Email-based invitation
      if (!createLinkInvitationDto.targetEmail) {
        throw new BadRequestException(
          'Target email is required for email invitations'
        );
      }

      // Check if source organization exists
      const sourceOrg = await this.organizationModel
        .findById(createLinkInvitationDto.sourceOrganizationId)
        .exec();

      if (!sourceOrg) {
        throw new NotFoundException('Source organization not found');
      }

      // Check for existing invitation
      const existingInvitation = await this.linkInvitationModel
        .findOne({
          sourceOrganization: createLinkInvitationDto.sourceOrganizationId,
          targetEmail: createLinkInvitationDto.targetEmail,
          status: 'pending',
        })
        .exec();

      if (existingInvitation) {
        throw new BadRequestException(
          'An invitation already exists for this email'
        );
      }

      // Create the invitation
      const invitation = new this.linkInvitationModel({
        sourceOrganization: createLinkInvitationDto.sourceOrganizationId,
        targetEmail: createLinkInvitationDto.targetEmail,
        message: createLinkInvitationDto.message,
        linkType: createLinkInvitationDto.linkType || 'default',
        createdBy: userId,
      });

      await invitation.save();

      // Send invitation email
      await this.emailService.sendEmail({
        to: createLinkInvitationDto.targetEmail,
        subject: `Organization Link Invitation from ${sourceOrg.name}`,
        html: `
          <h2>Organization Link Invitation</h2>
          <p>${
            sourceOrg.name
          } has invited your organization to link with them.</p>
          <p>${createLinkInvitationDto.message || ''}</p>
          <p>Please log in to your account to respond to this invitation.</p>
        `,
      });

      return invitation;
    }
  }

  /**
   * Get link invitations for an organization
   */
  async getLinkInvitations(
    organizationId: Types.ObjectId
  ): Promise<LinkInvitation[]> {
    return this.linkInvitationModel
      .find({
        $or: [
          { sourceOrganization: organizationId },
          { targetOrganization: organizationId },
        ],
        status: 'pending',
      })
      .populate('sourceOrganization', 'name logoUrl')
      .populate('targetOrganization', 'name logoUrl')
      .exec();
  }

  /**
   * Delete a link invitation
   */
  async deleteLinkInvitation(
    invitationId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<void> {
    const invitation = await this.linkInvitationModel
      .findById(invitationId)
      .exec();

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Only the creator or target can delete the invitation
    const userRoles = await this.organizationRoleModel
      .find({
        userId: userId,
        $or: [
          { organizationId: invitation.sourceOrganization },
          { organizationId: invitation.targetOrganization },
        ],
        roleId: { $in: ['ORGANIZATION_ADMIN', 'ORGANIZATION_OWNER'] }, // Use your actual role IDs
      })
      .exec();

    if (
      userRoles.length === 0 &&
      invitation.createdBy.toString() !== userId.toString()
    ) {
      throw new BadRequestException(
        'You do not have permission to delete this invitation'
      );
    }

    await this.linkInvitationModel.findByIdAndDelete(invitationId).exec();
  }

  /**
   * Respond to a link invitation
   */
  async respondToLinkInvitation(
    respondToInvitationDto: RespondToLinkInvitationDto,
    userId: Types.ObjectId,
    organizationId: Types.ObjectId
  ): Promise<any> {
    const invitation = await this.linkInvitationModel
      .findById(respondToInvitationDto.invitationId)
      .populate('sourceOrganization')
      .exec();

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Check if user is an admin of the target organization
    const isAdmin = await this.organizationRoleModel.exists({
      userId: userId,
      organizationId: invitation.targetOrganization,
      roleId: { $in: ['ORGANIZATION_ADMIN', 'ORGANIZATION_OWNER'] }, // Use your actual role IDs
    });

    if (!isAdmin) {
      throw new BadRequestException(
        'You do not have permission to respond to this invitation'
      );
    }

    // Update invitation status
    invitation.status = respondToInvitationDto.accept ? 'accepted' : 'rejected';
    invitation.notes = respondToInvitationDto.notes;
    invitation.respondedBy = userId as any;
    invitation.respondedAt = new Date();

    await invitation.save();

    // If accepted, link the organizations
    if (respondToInvitationDto.accept) {
      await this.linkOrganizations(
        {
          sourceOrganizationId: invitation.sourceOrganization as any,
          targetOrganizationId: invitation.targetOrganization as any,
          linkType: invitation.linkType,
        },
        userId
      );
    }

    // Notify source organization
    const sourceOrg = invitation.sourceOrganization as any;
    const targetOrg: any = await this.organizationModel
      .findById(invitation.targetOrganization)
      .exec();

    const notificationTitle = respondToInvitationDto.accept
      ? 'Link Invitation Accepted'
      : 'Link Invitation Rejected';

    const notificationBody = respondToInvitationDto.accept
      ? `${targetOrg.name} has accepted your link invitation.`
      : `${targetOrg.name} has rejected your link invitation.`;

    await this.notifyAdmins(sourceOrg._id, notificationTitle, notificationBody);

    return {
      success: true,
      status: invitation.status,
      invitation,
    };
  }

  /**
   * Notify organization admins
   */
  private async notifyAdmins(
    organizationId: Types.ObjectId | string,
    title: string,
    body: string
  ): Promise<void> {
    try {
      // Get all admin roles for the organization
      const adminRoles = await this.organizationRoleModel
        .find({
          organizationId: organizationId,
          roleId: { $in: ['owner', 'admin'] }, // Use your actual role IDs
        })
        .populate('userId')
        .exec();

      if (adminRoles.length === 0) {
        throw new Error('No admins or owners found for this organization');
        return;
      }
      // Get admin user IDs and emails
      const adminUserIds = adminRoles.map((role: any) => role.userId._id);
      const adminEmails = adminRoles.map((role: any) => role.userId.email);
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
      throw error;
    }
  }
}

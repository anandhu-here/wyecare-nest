// super-admin/services/organization-invitation.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { EmailService } from 'libs/shared/utils/src/lib/services/email.service';
import { CreateOrgInvitationDto } from '../dto/create-org-invitation.dto';
import {
  OrganizationCreationInvitation,
  OrganizationCreationInvitationDocument,
  Role,
} from '../../../../../core/src/lib/schemas';
import { User, UserDocument } from '../../../../../core/src/lib/schemas';
import { AuthorizationService } from '../../authorization/services/authorization.service';
import { UserMetadata } from '../../../../../core/src/lib/schemas';

@Injectable()
export class OrganizationInvitationService {
  private readonly logger = new Logger(OrganizationInvitationService.name);

  constructor(
    @InjectModel(Role.name) private roleModel: Model<Role>,
    @InjectModel(UserMetadata.name)
    private userMetadataModel: Model<UserMetadata>,
    @InjectModel(OrganizationCreationInvitation.name)
    private invitationModel: Model<OrganizationCreationInvitationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private emailService: EmailService,
    private authorizationService: AuthorizationService
  ) {}

  /**
   * Create a new organization creation invitation
   */
  async createInvitation(
    createInvitationDto: CreateOrgInvitationDto,
    superAdminId: Types.ObjectId
  ): Promise<OrganizationCreationInvitation> {
    // Check if there's already a pending invitation for this email
    const existingInvitation = await this.invitationModel.findOne({
      email: createInvitationDto.email,
      status: 'pending',
    });

    if (existingInvitation) {
      throw new BadRequestException(
        'There is already a pending invitation for this email'
      );
    }

    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      email: createInvitationDto.email,
    });

    if (existingUser) {
      // If the user exists, we could potentially still send an invitation
      // but with different logic to grant them organization creation permissions
      // For now, let's prevent duplicate invitations
      throw new BadRequestException('A user with this email already exists');
    }

    // Generate token
    const token = this.generateToken();

    // Set expiration (48 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    // Create invitation
    const invitation = new this.invitationModel({
      ...createInvitationDto,
      token,
      invitedBy: superAdminId,
      expiresAt,
      status: 'pending',
    });

    const savedInvitation = await invitation.save();

    // Send invitation email
    await this.sendInvitationEmail(savedInvitation);

    return savedInvitation;
  }

  /**
   * Get all invitations (with pagination and filtering options)
   */
  async getInvitations(
    page = 1,
    limit = 10,
    status?: string
  ): Promise<{ invitations: OrganizationCreationInvitation[]; total: number }> {
    const query: any = {};
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [invitations, total] = await Promise.all([
      this.invitationModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('invitedBy', 'firstName lastName email')
        .populate('acceptedBy', 'firstName lastName email')
        .exec(),
      this.invitationModel.countDocuments(query).exec(),
    ]);

    return { invitations, total };
  }

  /**
   * Get a single invitation by token
   */
  async getInvitationByToken(
    token: string
  ): Promise<OrganizationCreationInvitation> {
    console.log(token, 'tokkk');
    const invitation = await this.invitationModel.findOne({ token }).exec();

    console.log(invitation, 'innnn');

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Check if invitation is expired
    if (invitation.status === 'expired' || invitation.expiresAt < new Date()) {
      if (invitation.status !== 'expired') {
        invitation.status = 'expired';
        await invitation.save();
      }
      throw new BadRequestException('Invitation has expired');
    }

    return invitation;
  }

  /**
   * Cancel/delete an invitation
   */
  async cancelInvitation(invitationId: Types.ObjectId): Promise<void> {
    const result = await this.invitationModel.deleteOne({ _id: invitationId });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Invitation not found');
    }
  }

  /**
   * Resend an invitation
   */
  async resendInvitation(
    invitationId: Types.ObjectId
  ): Promise<OrganizationCreationInvitation> {
    const invitation = await this.invitationModel.findById(invitationId);

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Generate new token and update expiration
    invitation.token = this.generateToken();
    invitation.expiresAt = new Date();
    invitation.expiresAt.setHours(invitation.expiresAt.getHours() + 48);
    invitation.status = 'pending';

    const updatedInvitation = await invitation.save();

    // Send invitation email
    await this.sendInvitationEmail(updatedInvitation);

    return updatedInvitation;
  }

  async grantPermissionToCreateOrganization(
    userId: Types.ObjectId,
    roleToAssign: string,
    grantedById: Types.ObjectId
  ): Promise<void> {
    try {
      // Grant the system-level 'create_organization' permission
      await this.authorizationService.grantCustomPermission(
        userId,
        'create_organization',
        grantedById,
        { contextType: 'SYSTEM' }
      );

      // Store the role that should be assigned when they create an organization
      // We'll use a user metadata document to store this information
      await this.userMetadataModel.findOneAndUpdate(
        { userId },
        {
          $set: {
            pendingOrgRole: roleToAssign,
            pendingOrgRoleGrantedAt: new Date(),
            pendingOrgRoleGrantedBy: grantedById,
          },
        },
        { upsert: true }
      );

      this.logger.log(
        `Granted create_organization permission to user ${userId} with pending role ${roleToAssign}`
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to grant organization creation permission: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Mark invitation as accepted (when user registers)
   */
  async acceptInvitation(
    token: string,
    userId: Types.ObjectId
  ): Promise<OrganizationCreationInvitation> {
    const invitation: any = await this.getInvitationByToken(token);

    invitation.status = 'accepted';
    invitation.acceptedBy = userId as any;
    invitation.acceptedAt = new Date();

    return invitation.save();
  }

  /**
   * Generate a secure random token
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Send invitation email
   */
  private async sendInvitationEmail(
    invitation: OrganizationCreationInvitation
  ): Promise<void> {
    const inviterInfo = await this.userModel.findById(invitation.invitedBy);

    // Get the role with display names
    const role = await this.roleModel.findOne({ id: invitation.roleToAssign });

    if (!role) {
      this.logger.error(
        `Role ${invitation.roleToAssign} not found when sending email`
      );
      return;
    }

    // Get appropriate role display name for the organization type
    let roleName = role.name;
    if (role.displayNames && role.displayNames[invitation.organizationType]) {
      roleName = role.displayNames[invitation.organizationType];
    }

    const subject = `Invitation to Create a ${this.getOrganizationTypeDisplayName(
      invitation.organizationType
    )}`;

    // Create registration URL with token and organization type
    const registrationUrl = `${process.env['FRONTEND_URL']}/auth/register-with-invitation?token=${invitation.token}&orgType=${invitation.organizationType}`;

    // Build email content with context-appropriate terminology
    const html = `
    <h2>You've been invited to create a ${this.getOrganizationTypeDisplayName(
      invitation.organizationType
    )}!</h2>
    <p>Hello ${invitation.firstName || ''},</p>
    <p>${
      inviterInfo?.firstName || 'A system administrator'
    } has invited you to create an organization as ${roleName}.</p>
    ${invitation.message ? `<p>Message: "${invitation.message}"</p>` : ''}
    <p>To accept this invitation, please register using the link below:</p>
    <p><a href="${registrationUrl}">Accept Invitation & Register</a></p>
    <p>This invitation will expire on ${invitation.expiresAt.toLocaleDateString()}.</p>
    <p>Thank you,<br>The Team</p>
  `;

    try {
      await this.emailService.sendEmail({
        to: invitation.email,
        subject,
        html,
      });
    } catch (error: any) {
      this.logger.error(`Failed to send invitation email: ${error.message}`);
    }
  }

  private getOrganizationTypeDisplayName(type: string): string {
    const displayNames: any = {
      care_home: 'Care Home',
      hospital: 'Hospital',
      education: 'Educational Institution',
      healthcare: 'Healthcare Provider',
      social_services: 'Social Services Organization',
      retail: 'Retail Business',
      service_provider: 'Service Provider',
      other: 'Organization',
    };

    return displayNames[type] || 'Organization';
  }
}

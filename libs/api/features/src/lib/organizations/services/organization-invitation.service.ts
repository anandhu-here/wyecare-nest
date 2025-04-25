import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrganizationStaffService } from './organization-staff.service';
import * as crypto from 'crypto';
import {
  Organization,
  OrganizationDocument,
} from '../../../../../core/src/lib/schemas';
import { User, UserDocument } from '../../../../../core/src/lib/schemas';
import { EmailService } from 'libs/shared/utils/src/lib/services/email.service';
import { CreateOrganizationInvitationDto } from '../dto/create-organization-invitation.dto';
import {
  OrganizationRole,
  OrganizationRoleDocument,
} from '../../../../../core/src/lib/schemas';
import {
  OrganizationInvitation,
  OrganizationInvitationDocument,
} from '../../../../../core/src/lib/schemas';

@Injectable()
export class OrganizationInvitationService {
  private readonly logger = new Logger(OrganizationInvitationService.name);

  constructor(
    @InjectModel(Organization.name)
    private organizationModel: Model<OrganizationDocument>,
    @InjectModel(OrganizationInvitation.name)
    private organizationInvitationModel: Model<OrganizationInvitationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(OrganizationRole.name)
    private organizationRoleModel: Model<OrganizationRoleDocument>,
    private emailService: EmailService,
    private organizationStaffService: OrganizationStaffService
  ) {}

  /**
   * Create an organization invitation
   */
  async createOrganizationInvitation(
    createInvitationDto: CreateOrganizationInvitationDto,
    userId: Types.ObjectId,
    organizationId: Types.ObjectId
  ): Promise<OrganizationInvitation> {
    // Validate organization ID match
    if (
      createInvitationDto.organizationId.toString() !==
      organizationId.toString()
    ) {
      throw new BadRequestException('Organization ID mismatch');
    }

    // Check if organization exists
    const organization = await this.organizationModel
      .findById(createInvitationDto.organizationId)
      .exec();

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if user already exists
    const existingUser = await this.userModel
      .findOne({ email: createInvitationDto.email })
      .exec();

    if (existingUser) {
      // Check if user is already in the organization
      const existingRole = await this.organizationRoleModel
        .findOne({
          user: existingUser._id,
          organization: createInvitationDto.organizationId,
        })
        .exec();

      if (existingRole) {
        throw new BadRequestException(
          'User is already a member of this organization'
        );
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await this.organizationInvitationModel
      .findOne({
        organization: createInvitationDto.organizationId,
        email: createInvitationDto.email,
        status: 'pending',
      })
      .exec();

    // Generate a token for the invitation
    const token = this.generateInvitationToken(
      createInvitationDto.email,
      createInvitationDto.organizationId.toString()
    );

    // Calculate expiry date (7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    let invitation: any;

    // Update existing invitation or create new one
    if (existingInvitation) {
      invitation = await this.organizationInvitationModel
        .findByIdAndUpdate(
          existingInvitation._id,
          {
            token,
            expiresAt,
            status: 'pending',
            invitedBy: userId,
            role: createInvitationDto.role,
            message: createInvitationDto.message,
            firstName: createInvitationDto.firstName,
            lastName: createInvitationDto.lastName,
            $unset: { acceptedBy: 1, acceptedAt: 1 },
          },
          { new: true }
        )
        .exec();
    } else {
      invitation = new this.organizationInvitationModel({
        organization: createInvitationDto.organizationId,
        email: createInvitationDto.email,
        token,
        invitedBy: userId,
        expiresAt,
        role: createInvitationDto.role,
        message: createInvitationDto.message,
        firstName: createInvitationDto.firstName,
        lastName: createInvitationDto.lastName,
      });

      await invitation.save();
    }

    // Send invitation email
    await this.sendInvitationEmail(invitation, organization);

    return invitation;
  }

  /**
   * Get all invitations for an organization
   */
  async getAllInvitations(
    organizationId: Types.ObjectId
  ): Promise<OrganizationInvitation[]> {
    return this.organizationInvitationModel
      .find({
        organization: organizationId,
        status: 'pending',
        expiresAt: { $gt: new Date() },
      })
      .populate('invitedBy', 'firstName lastName email')
      .exec();
  }

  /**
   * Validate an invitation token
   */
  async validateInvitationToken(
    token: string
  ): Promise<OrganizationInvitation> {
    const invitation = await this.organizationInvitationModel
      .findOne({
        token,
        status: 'pending',
        expiresAt: { $gt: new Date() },
      })
      .populate({
        path: 'organization',
        select: 'name logoUrl email phone address',
      })
      .populate('invitedBy', 'firstName lastName email')
      .exec();

    if (!invitation) {
      throw new NotFoundException('Invalid or expired invitation token');
    }

    return invitation;
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(token: string, userId: Types.ObjectId): Promise<any> {
    // Validate invitation
    const invitation: any = await this.validateInvitationToken(token);

    // Check if the user's email matches the invitation
    const user: any = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new BadRequestException(
        'This invitation was sent to a different email address'
      );
    }

    // Get the organization
    const organization: any = await this.organizationModel
      .findById(invitation.organization)
      .exec();

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Add user to organization with the specified role
    await this.organizationStaffService.addUserToOrganization(
      {
        userId: user._id.toString(),
        organizationId: organization._id.toString(),
        role: invitation.role,
      },
      invitation.invitedBy as any
    );

    // Update invitation status
    invitation.status = 'accepted';
    invitation.acceptedBy = userId as any;
    invitation.acceptedAt = new Date();
    await invitation.save();

    return {
      success: true,
      organization: {
        _id: organization._id,
        name: organization.name,
      },
      role: invitation.role,
    };
  }

  /**
   * Generate invitation token
   */
  private generateInvitationToken(
    email: string,
    organizationId: string
  ): string {
    const data = `${email.toLowerCase()}:${organizationId}:${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Send invitation email
   */
  private async sendInvitationEmail(
    invitation: OrganizationInvitation,
    organization: Organization
  ): Promise<void> {
    try {
      const inviteLink = `${process.env['FRONTEND_URL']}/join-organization?token=${invitation.token}`;

      await this.emailService.sendEmail({
        to: invitation.email,
        subject: `Invitation to join ${organization.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h2 style="color: #333;">You've Been Invited!</h2>
            <p>Hello ${invitation.firstName || ''},</p>
            <p>You have been invited to join <strong>${
              organization.name
            }</strong> with the role of <strong>${invitation.role}</strong>.</p>
            ${invitation.message ? `<p>Message: ${invitation.message}</p>` : ''}
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" 
                style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Accept Invitation
              </a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">${inviteLink}</p>
            <p>This invitation will expire in 7 days.</p>
            <p>Best regards,<br>${organization.name} Team</p>
          </div>
        `,
      });
    } catch (error: any) {
      this.logger.error(
        `Error sending invitation email: ${error.message}`,
        error.stack
      );
    }
  }
}

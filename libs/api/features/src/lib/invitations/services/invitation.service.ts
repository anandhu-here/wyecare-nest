import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import {
  StaffInvitation,
  StaffInvitationDocument,
} from '../schemas/staff-invitation.schema';
import {
  OrganizationCreationInvitation,
  OrganizationCreationInvitationDocument,
} from '../schemas/organization-creation-invitation.schema';
import { EventBusService } from '../../events/services/event-bus.service';
import { EmailService } from 'libs/shared/utils/src/lib/services/email.service';
import { CreateStaffInvitationDto } from '../dto/create-staff-invitation.dto';
import { CreateOrgInvitationDto } from '../dto/create-org-invitation.dto';

@Injectable()
export class InvitationService {
  private readonly logger = new Logger(InvitationService.name);

  constructor(
    @InjectModel(StaffInvitation.name)
    private staffInvitationModel: Model<StaffInvitationDocument>,
    @InjectModel(OrganizationCreationInvitation.name)
    private orgInvitationModel: Model<OrganizationCreationInvitationDocument>,
    private emailService: EmailService,
    private eventBusService: EventBusService
  ) {}

  async createStaffInvitation(
    organizationId: Types.ObjectId,
    createInvitationDto: CreateStaffInvitationDto,
    invitedById: Types.ObjectId
  ): Promise<StaffInvitation> {
    // Check if there's already a pending invitation for this email in this org
    const existingInvitation = await this.staffInvitationModel.findOne({
      email: createInvitationDto.email,
      organizationId,
      status: 'pending',
    });

    if (existingInvitation) {
      throw new BadRequestException(
        'There is already a pending invitation for this email in this organization'
      );
    }

    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    const invitation = new this.staffInvitationModel({
      ...createInvitationDto,
      organizationId,
      token,
      invitedBy: invitedById,
      expiresAt,
      status: 'pending',
    });

    const savedInvitation = await invitation.save();
    await this.sendStaffInvitationEmail(savedInvitation);

    return savedInvitation;
  }

  async getStaffInvitations(
    organizationId: Types.ObjectId,
    page = 1,
    limit = 10,
    status?: string
  ): Promise<{ invitations: StaffInvitation[]; total: number }> {
    const query: any = { organizationId };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [invitations, total] = await Promise.all([
      this.staffInvitationModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('invitedBy', 'firstName lastName email')
        .populate('acceptedBy', 'firstName lastName email')
        .exec(),
      this.staffInvitationModel.countDocuments(query).exec(),
    ]);

    return { invitations, total };
  }

  async getStaffInvitationByToken(token: string): Promise<StaffInvitation> {
    const invitation = await this.staffInvitationModel
      .findOne({ token })
      .populate('invitedBy', 'firstName lastName email')
      .populate('organizationId', 'name type')
      .exec();

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

  async cancelStaffInvitation(
    organizationId: Types.ObjectId,
    invitationId: Types.ObjectId
  ): Promise<void> {
    const result = await this.staffInvitationModel.deleteOne({
      _id: invitationId,
      organizationId,
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Invitation not found');
    }
  }

  async resendStaffInvitation(
    organizationId: Types.ObjectId,
    invitationId: Types.ObjectId
  ): Promise<StaffInvitation> {
    const invitation = await this.staffInvitationModel.findOne({
      _id: invitationId,
      organizationId,
    });

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
    await this.sendStaffInvitationEmail(updatedInvitation);

    return updatedInvitation;
  }

  async markStaffInvitationAccepted(
    token: string,
    userId: Types.ObjectId
  ): Promise<void> {
    const invitation: any = await this.getStaffInvitationByToken(token);

    invitation.status = 'accepted';
    invitation.acceptedBy = userId;
    invitation.acceptedAt = new Date();
    await invitation.save();

    this.logger.log(
      `Staff invitation ${token} marked as accepted by user ${userId}`
    );
  }

  async createOrganizationInvitation(
    data: CreateOrgInvitationDto
  ): Promise<OrganizationCreationInvitation> {
    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    const invitation = new this.orgInvitationModel({
      ...data,
      token,
      expiresAt,
      status: 'pending',
    });

    const savedInvitation = await invitation.save();
    await this.sendOrganizationInvitationEmail(savedInvitation);

    return savedInvitation;
  }

  async getOrganizationInvitationByToken(
    token: string
  ): Promise<OrganizationCreationInvitation> {
    const invitation = await this.orgInvitationModel
      .findOne({ token })
      .populate('invitedBy', 'firstName lastName email')
      .exec();

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status === 'expired' || invitation.expiresAt < new Date()) {
      if (invitation.status !== 'expired') {
        invitation.status = 'expired';
        await invitation.save();
      }
      throw new BadRequestException('Invitation has expired');
    }

    return invitation;
  }

  async markOrganizationInvitationAccepted(
    token: string,
    userId: Types.ObjectId
  ): Promise<void> {
    const invitation: any = await this.getOrganizationInvitationByToken(token);

    invitation.status = 'accepted';
    invitation.acceptedBy = userId;
    invitation.acceptedAt = new Date();
    await invitation.save();

    this.logger.log(
      `Organization invitation ${token} marked as accepted by user ${userId}`
    );
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async sendStaffInvitationEmail(
    invitation: StaffInvitation
  ): Promise<void> {
    try {
      // This is a simplified version - you'll need to adapt this to your existing email logic
      const registrationUrl = `${process.env['FRONTEND_URL']}/auth/register-with-invitation?token=${invitation.token}&type=staff`;

      const html = `
        <h2>You've been invited to join an organization!</h2>
        <p>Hello ${invitation.firstName || ''},</p>
        <p>You have been invited to join the organization as ${
          invitation.role
        }.</p>
        ${invitation.message ? `<p>Message: "${invitation.message}"</p>` : ''}
        <p>To accept this invitation, please register using the link below:</p>
        <p><a href="${registrationUrl}">Accept Invitation & Register</a></p>
        <p>This invitation will expire on ${invitation.expiresAt.toLocaleDateString()}.</p>
        <p>Thank you</p>
      `;

      await this.emailService.sendEmail({
        to: invitation.email,
        subject: 'You have been invited to join an organization',
        html,
      });
    } catch (error: any) {
      this.logger.error(`Failed to send invitation email: ${error.message}`);
      // Don't throw error to prevent transaction failure
    }
  }

  private async sendOrganizationInvitationEmail(
    invitation: OrganizationCreationInvitation
  ): Promise<void> {
    try {
      // This is a simplified version - you'll need to adapt this to your existing email logic
      const registrationUrl = `${process.env['FRONTEND_URL']}/auth/register-with-invitation?token=${invitation.token}&type=organization`;

      const html = `
        <h2>You've been invited to create an organization!</h2>
        <p>Hello ${invitation.firstName || ''},</p>
        <p>You have been invited to create a new organization.</p>
        ${invitation.message ? `<p>Message: "${invitation.message}"</p>` : ''}
        <p>To accept this invitation, please register using the link below:</p>
        <p><a href="${registrationUrl}">Accept Invitation & Register</a></p>
        <p>This invitation will expire on ${invitation.expiresAt.toLocaleDateString()}.</p>
        <p>Thank you</p>
      `;

      await this.emailService.sendEmail({
        to: invitation.email,
        subject: 'You have been invited to create an organization',
        html,
      });
    } catch (error: any) {
      this.logger.error(`Failed to send invitation email: ${error.message}`);
      // Don't throw error to prevent transaction failure
    }
  }
}

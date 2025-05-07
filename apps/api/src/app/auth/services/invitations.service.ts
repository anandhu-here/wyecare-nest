// app/auth/services/invitations.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvitationDto } from '../dto/create-invitation.dto';
import { v4 as uuidv4 } from 'uuid';
import { User, Prisma } from '@prisma/client';
import { EmailService } from '../../shared/services/email.service';

@Injectable()
export class InvitationsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

  async create(createInvitationDto: CreateInvitationDto, currentUser: User) {
    try {
      // Check if user is super admin
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId: currentUser.id },
        include: { role: true },
      });

      const isSuperAdmin = userRoles.some(
        (ur) => ur.role.isSystemRole && ur.role.name === 'Super Admin'
      );

      // If not super admin, ensure they're inviting to their org
      if (
        !isSuperAdmin &&
        createInvitationDto.organizationId &&
        createInvitationDto.organizationId !== currentUser.organizationId
      ) {
        throw new UnauthorizedException(
          'You can only invite users to your organization'
        );
      }

      // Check if role exists and is valid
      if (createInvitationDto.roleId) {
        const role = await this.prisma.role.findUnique({
          where: { id: createInvitationDto.roleId },
        });

        if (!role) {
          throw new NotFoundException(
            `Role with ID ${createInvitationDto.roleId} not found`
          );
        }

        // If not a system role, check if it belongs to the organization
        if (
          !role.isSystemRole &&
          createInvitationDto.organizationId &&
          role.organizationId !== createInvitationDto.organizationId
        ) {
          throw new BadRequestException(
            'Role does not belong to the specified organization'
          );
        }
      }

      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: createInvitationDto.email },
      });

      if (existingUser) {
        throw new ConflictException('A user with this email already exists');
      }

      // Check if there's already a pending invitation for this email
      const existingInvitation = await this.prisma.invitation.findFirst({
        where: {
          email: createInvitationDto.email,
          status: 'PENDING',
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (existingInvitation) {
        throw new ConflictException(
          'There is already a pending invitation for this email'
        );
      }

      // Set default expiration if not provided (30 days)
      const expiresAt = createInvitationDto.expiresAt
        ? createInvitationDto.expiresAt
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Generate unique token
      const token = uuidv4();

      // Create invitation
      const invitation = await this.prisma.invitation.create({
        data: {
          email: createInvitationDto.email,
          organizationId: createInvitationDto.organizationId || null,
          roleId: createInvitationDto.roleId,
          token,
          status: 'PENDING',
          expiresAt,
          createdById: currentUser.id,
          message: createInvitationDto.message,
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          role: {
            select: {
              id: true,
              name: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      const senderName = `${currentUser.firstName} ${currentUser.lastName}`;

      // If there's an organization, send an organization-specific invitation
      // Otherwise, send a platform invitation (for Super Admin)
      await this.emailService.sendInvitationEmail(
        invitation.email,
        invitation.token,
        { name: senderName, email: currentUser.email },
        invitation.organization?.name,
        invitation.role?.name,
        invitation.message
      );

      return invitation;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new BadRequestException(
        `Failed to create invitation: ${error.message}`
      );
    }
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.InvitationWhereInput;
    orderBy?: Prisma.InvitationOrderByWithRelationInput;
    currentUser: User;
  }) {
    const { skip, take, where, orderBy, currentUser } = params;

    // If user is not system admin, restrict to their organization
    let finalWhere = where;
    if (currentUser.organizationId) {
      // Check if user has super admin permissions
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId: currentUser.id },
        include: { role: true },
      });

      const isSuperAdmin = userRoles.some(
        (ur) => ur.role.isSystemRole && ur.role.name === 'Super Admin'
      );

      if (!isSuperAdmin) {
        finalWhere = {
          ...where,
          organizationId: currentUser.organizationId,
        };
      }
    }

    try {
      const [invitations, total] = await Promise.all([
        this.prisma.invitation.findMany({
          skip,
          take,
          where: finalWhere,
          orderBy,
          include: {
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
            role: {
              select: {
                id: true,
                name: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            acceptedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        }),
        this.prisma.invitation.count({ where: finalWhere }),
      ]);

      return {
        invitations,
        total,
        skip,
        take,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch invitations: ${error.message}`
      );
    }
  }

  async findOne(id: string, currentUser: User) {
    try {
      const invitation = await this.prisma.invitation.findUnique({
        where: { id },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          role: {
            select: {
              id: true,
              name: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          acceptedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!invitation) {
        throw new NotFoundException(`Invitation with ID ${id} not found`);
      }

      // Check if user has permission to view this invitation
      if (
        invitation.organizationId &&
        invitation.organizationId !== currentUser.organizationId
      ) {
        // Check if user has super admin permissions
        const userRoles = await this.prisma.userRole.findMany({
          where: { userId: currentUser.id },
          include: { role: true },
        });

        const isSuperAdmin = userRoles.some(
          (ur) => ur.role.isSystemRole && ur.role.name === 'Super Admin'
        );

        if (!isSuperAdmin) {
          throw new UnauthorizedException(
            'You do not have permission to view this invitation'
          );
        }
      }

      return invitation;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      throw new BadRequestException(
        `Failed to fetch invitation: ${error.message}`
      );
    }
  }

  async findByToken(token: string) {
    try {
      const invitation = await this.prisma.invitation.findUnique({
        where: { token },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }

      if (invitation.status !== 'PENDING') {
        throw new BadRequestException('Invitation has already been used');
      }

      if (invitation.expiresAt && new Date() > invitation.expiresAt) {
        throw new BadRequestException('Invitation has expired');
      }

      return invitation;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new BadRequestException(
        `Failed to fetch invitation: ${error.message}`
      );
    }
  }

  async revoke(id: string, currentUser: User) {
    try {
      // First check if invitation exists and user has permission
      const invitation = await this.findOne(id, currentUser);

      // Only pending invitations can be revoked
      if (invitation.status !== 'PENDING') {
        throw new BadRequestException(
          'Only pending invitations can be revoked'
        );
      }

      // Update invitation status
      const revokedInvitation = await this.prisma.invitation.update({
        where: { id },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
          revokedById: currentUser.id,
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          role: {
            select: {
              id: true,
              name: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return revokedInvitation;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new BadRequestException(
        `Failed to revoke invitation: ${error.message}`
      );
    }
  }

  async resend(id: string, currentUser: User) {
    try {
      // First check if invitation exists and user has permission
      const invitation = await this.findOne(id, currentUser);

      // Only revoked or expired invitations can be resent
      if (
        invitation.status !== 'REVOKED' &&
        !(
          invitation.status === 'PENDING' &&
          invitation.expiresAt &&
          new Date() > invitation.expiresAt
        )
      ) {
        throw new BadRequestException(
          'Only revoked or expired invitations can be resent'
        );
      }

      // Generate new token
      const token = uuidv4();

      // Set default expiration (30 days)
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Update invitation
      const resentInvitation = await this.prisma.invitation.update({
        where: { id },
        data: {
          token,
          status: 'PENDING',
          expiresAt,
          createdAt: new Date(),
          revokedAt: null,
          revokedById: null,
          acceptedAt: null,
          acceptedById: null,
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          role: {
            select: {
              id: true,
              name: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // In a real app, you would send an email with the invitation link here
      // For now, just return the invitation object with the token

      const senderName = `${currentUser.firstName} ${currentUser.lastName}`;
      if (resentInvitation.organizationId) {
        await this.emailService.sendInvitationEmail(
          resentInvitation.email,
          resentInvitation.token,
          { name: senderName, email: currentUser.email },
          resentInvitation.organization?.name,
          resentInvitation.role?.name,
          resentInvitation.message
        );
      }

      return resentInvitation;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new BadRequestException(
        `Failed to resend invitation: ${error.message}`
      );
    }
  }
}

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Organization } from '../organizations/schemas/organization.schema';
import { OrganizationRole } from './schemas/organization-role.schema';

@Injectable()
export class CurrentOrganizationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CurrentOrganizationInterceptor.name);
  constructor(
    @InjectModel(OrganizationRole.name)
    private organizationRoleModel: Model<OrganizationRole & Document>,
    @InjectModel(Organization.name)
    private organizationModel: Model<Organization & Document>
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no authenticated user, just continue
    if (!user) {
      this.logger.debug('No authenticated user found');
      return next.handle();
    }

    // First check if an explicit organization ID was provided
    const explicitOrgId =
      request.params.organizationId ||
      request.query.organizationId ||
      request.body.organizationId ||
      request.headers['x-organization-id'];

    if (explicitOrgId) {
      this.logger.debug(`Explicit organization ID provided: ${explicitOrgId}`);
      // Validate this organization ID is accessible to the user
      const hasAccess = await this.validateUserAccess(user._id, explicitOrgId);

      if (hasAccess) {
        const organization = await this.organizationModel.findById(
          explicitOrgId
        );
        if (organization) {
          request.currentOrganization = organization;
          const orgRole = await this.getUserRoleInOrganization(
            user._id,
            explicitOrgId
          );
          if (orgRole) {
            request.userOrganizationRole = orgRole;
          }
          this.logger.debug(`Set current organization to ${organization.name}`);
        }
      }
    } else {
      this.logger.debug(
        'No explicit organization ID - fetching primary organization'
      );
      // No explicit ID - get the user's primary organization directly from DB
      const primaryOrgRole = await this.organizationRoleModel.findOne({
        userId: user._id,
        isPrimary: true,
        isActive: true,
      });

      if (primaryOrgRole) {
        const organization = await this.organizationModel.findById(
          primaryOrgRole.organizationId
        );
        if (organization) {
          request.currentOrganization = organization;
          request.userOrganizationRole = primaryOrgRole;
          this.logger.debug(
            `Set current organization to primary: ${organization.name}`
          );
        }
      } else {
        // Fall back to any organization the user belongs to
        const anyOrgRole = await this.organizationRoleModel.findOne({
          userId: user._id,
          isActive: true,
        });

        if (anyOrgRole) {
          const organization = await this.organizationModel.findById(
            anyOrgRole.organizationId
          );
          if (organization) {
            request.currentOrganization = organization;
            request.userOrganizationRole = anyOrgRole;
            this.logger.debug(
              `Set current organization to any available: ${organization.name}`
            );
          }
        } else {
          this.logger.debug('User does not belong to any organization');
        }
      }
    }

    return next.handle();
  }

  /**
   * Validates that a user has access to a specific organization
   */
  private async validateUserAccess(
    userId: Types.ObjectId,
    organizationId: Types.ObjectId
  ): Promise<boolean> {
    try {
      const orgRole = await this.organizationRoleModel.findOne({
        userId: userId,
        organizationId: organizationId,
        isActive: true,
      });

      return !!orgRole;
    } catch (error: any) {
      this.logger.error(`Error validating user access: ${error.message}`);
      return false;
    }
  }

  /**
   * Gets the user's role in a specific organization
   */
  private async getUserRoleInOrganization(
    userId: Types.ObjectId,
    organizationId: Types.ObjectId
  ): Promise<OrganizationRole | null> {
    try {
      return await this.organizationRoleModel.findOne({
        userId: userId,
        organizationId: organizationId,
        isActive: true,
      });
    } catch (error: any) {
      this.logger.error(`Error getting user role: ${error.message}`);
      return null;
    }
  }
}

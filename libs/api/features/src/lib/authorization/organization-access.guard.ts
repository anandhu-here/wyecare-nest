import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { AuthorizationService } from './services/authorization.service';

@Injectable()
export class OrganizationAccessGuard implements CanActivate {
  constructor(private authorizationService: AuthorizationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user is authenticated, deny access
    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }

    // Get the organization ID from params, query, or body
    const organizationId =
      request.params.organizationId ||
      request.query.organizationId ||
      request.body.organizationId;

    if (!organizationId) {
      throw new ForbiddenException('Organization ID is required');
    }

    // Check if the user has access to this organization
    const hasAccess =
      await this.authorizationService.validateUserOrganizationAccess(
        new Types.ObjectId(user._id),
        new Types.ObjectId(organizationId)
      );

    if (!hasAccess) {
      throw new ForbiddenException('User not authorized for this organization');
    }

    // Store the organization ID in the request for later use
    request.organizationId = organizationId;

    return true;
  }
}

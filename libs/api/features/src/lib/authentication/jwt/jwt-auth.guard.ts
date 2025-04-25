import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { Types } from 'mongoose';
import { AuthorizationService } from '../../authorization/services/authorization.service';
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private authorizationService: AuthorizationService) {
    super();
  }
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const parentCanActivate = await super.canActivate(context);
    if (!parentCanActivate) {
      return false;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      return false;
    }
    const organizationId = request.currentOrganization?._id;
    const contextType = organizationId ? 'ORGANIZATION' : 'SYSTEM';
    const permissions = await this.authorizationService.getAllUserPermissions(
      user._id?.toString(),
      {
        organizationId: organizationId
          ? new Types.ObjectId(organizationId)
          : undefined,
        contextType,
      }
    );
    request.permissions = permissions;
    return true;
  }
  override handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication failed');
    }
    return user;
  }
}

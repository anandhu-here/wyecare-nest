// super-admin/guards/super-admin.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../../../../core/src/lib/schemas';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const userData = await this.userModel.findById(user._id);

    if (!userData || !userData.isSuperAdmin) {
      throw new UnauthorizedException('Super admin privileges required');
    }

    return true;
  }
}

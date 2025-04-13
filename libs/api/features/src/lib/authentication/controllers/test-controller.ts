import {
  Controller,
  Get,
  UseGuards,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { Auth } from '../../authorization/auth.decorator';

@Controller('test')
export class TestController {
  @Get('auth-test')
  @UseGuards(JwtAuthGuard)
  async testAuth(@Req() req: any, @Res() res: Response) {
    return res.status(HttpStatus.OK).json({
      user: req.user,
      message: 'Authentication successful',
    });
  }

  @Get('system-permission')
  @Auth('create_organization')
  async testSystemPermission(@Req() req: any, @Res() res: Response) {
    return res.status(HttpStatus.OK).json({
      user: req.user,
      message: 'System permission check passed',
    });
  }

  @Get('org-permission')
  @Auth('view_organization')
  async testOrgPermission(@Req() req: any, @Res() res: Response) {
    return res.status(HttpStatus.OK).json({
      user: req.user,
      currentOrganization: req.currentOrganization,
      message: 'Organization permission check passed',
    });
  }

  @Get('context')
  @UseGuards(JwtAuthGuard)
  async getContext(@Req() req: any, @Res() res: Response) {
    return res.status(HttpStatus.OK).json({
      user: req.user ? { id: req.user._id } : null,
      currentOrganization: req.currentOrganization
        ? {
            id: req.currentOrganization._id,
            name: req.currentOrganization.name,
          }
        : null,
      userRole: req.userOrganizationRole
        ? {
            role: req.userOrganizationRole.roleId,
            isPrimary: req.userOrganizationRole.isPrimary,
          }
        : null,
    });
  }
}

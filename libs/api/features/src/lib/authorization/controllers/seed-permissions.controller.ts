import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { SeedService } from '../services/seed.service';

@Controller()
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post('seed-permission')
  async seedPermission(@Req() req: any, @Res() res: any) {
    await this.seedService.seedPermissions();
    await this.seedService.seedRoles();
    await this.seedService.seedPermissionImplications();
    await this.seedService.seedRolePermissions();

    return res.status(200).json({
      message: 'Seeded permissions successfully',
    });
  }

  @Post('create-super-admin')
  async createSuperAdmin(
    @Body()
    createSuperAdminDto: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone: string;
      countryCode: string;
      gender?: string;
      address?: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
      };
      countryMetadata?: {
        code: string;
        currency: string;
        region: string;
      };
      systemSecret: string;
    }
  ) {
    try {
      const result = await this.seedService.createSuperAdmin(
        createSuperAdminDto
      );
      return {
        success: true,
        message: 'Super admin created successfully',
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

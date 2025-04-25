// api/features/src/lib/analytics/controllers/analytics.controller.ts
import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  Logger,
  HttpStatus,
  HttpException,
  Res,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../authentication/jwt/jwt-auth.guard';
import { OrganizationContextGuard } from '../../organizations/organization-context.guard';
import { RequirePermission } from '../../authorization/permissions.decorator';
import { ShiftAnalyticsService } from '../services/shift-analytic.service';

@Controller('shift-analytics')
@UseGuards(JwtAuthGuard)
export class ShiftAnalyticsController {
  private readonly logger = new Logger(ShiftAnalyticsController.name);

  constructor(private readonly shiftAnalyticsService: ShiftAnalyticsService) {}

  @Get('staff')
  @UseGuards(JwtAuthGuard)
  @RequirePermission('view_analytics')
  async fetchStaffAnalytics(
    @Req() req: any,
    @Res() res: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: string
  ) {
    try {
      // Use the authenticated user's ID if no userId is specified
      const targetUserId = userId || req.user._id.toString();

      const dateRange =
        startDate && endDate
          ? { startDate: new Date(startDate), endDate: new Date(endDate) }
          : undefined;

      const analytics = await this.shiftAnalyticsService.getStaffAnalytics(
        targetUserId,
        dateRange
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: analytics,
      });
    } catch (error: any) {
      this.logger.error(
        `Error fetching staff analytics: ${error.message}`,
        error.stack
      );
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Error fetching staff analytics',
      });
    }
  }

  @Get('agency')
  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  @RequirePermission('view_analytics')
  async fetchAgencyAnalytics(
    @Req() req: any,
    @Res() res: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('agencyId') agencyId?: string
  ) {
    try {
      // Use the current organization's ID if no agencyId is specified
      const targetAgencyId = agencyId || req.currentOrganization._id.toString();

      const dateRange =
        startDate && endDate
          ? { startDate: new Date(startDate), endDate: new Date(endDate) }
          : undefined;

      const analytics = await this.shiftAnalyticsService.getAgencyAnalytics(
        targetAgencyId,
        dateRange
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: analytics,
      });
    } catch (error: any) {
      this.logger.error(
        `Error fetching agency analytics: ${error.message}`,
        error.stack
      );
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Error fetching agency analytics',
      });
    }
  }

  @Get('care-home')
  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  @RequirePermission('view_analytics')
  async fetchCareHomeAnalytics(
    @Req() req: any,
    @Res() res: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('homeId') homeId?: string
  ) {
    try {
      // Use the current organization's ID if no homeId is specified
      const targetHomeId = homeId || req.currentOrganization._id.toString();

      const dateRange =
        startDate && endDate
          ? { startDate: new Date(startDate), endDate: new Date(endDate) }
          : undefined;

      const analytics = await this.shiftAnalyticsService.getCareHomeAnalytics(
        targetHomeId,
        dateRange
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: analytics,
      });
    } catch (error: any) {
      this.logger.error(
        `Error fetching care home analytics: ${error.message}`,
        error.stack
      );
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Error fetching care home analytics',
      });
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  @RequirePermission('view_analytics')
  async fetchAnalyticsByRole(
    @Req() req: any,
    @Res() res: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    try {
      const { user, currentOrganization } = req;
      const dateRange =
        startDate && endDate
          ? { startDate: new Date(startDate), endDate: new Date(endDate) }
          : undefined;

      let analytics;

      // Route to appropriate analytics based on user role and current organization
      if (user.isSuperAdmin) {
        // For super admin, we could implement a summary dashboard
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Super admin analytics not implemented yet',
        });
      } else if (currentOrganization?.type === 'agency') {
        analytics = await this.shiftAnalyticsService.getAgencyAnalytics(
          currentOrganization._id.toString(),
          dateRange
        );
      } else if (currentOrganization?.type === 'home') {
        analytics = await this.shiftAnalyticsService.getCareHomeAnalytics(
          currentOrganization._id.toString(),
          dateRange
        );
      } else if (['carer', 'nurse', 'senior_carer'].includes(user.role)) {
        analytics = await this.shiftAnalyticsService.getStaffAnalytics(
          user._id.toString(),
          dateRange
        );
      } else {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Invalid user role or organization type for analytics',
        });
      }

      return res.status(HttpStatus.OK).json({
        success: true,
        data: analytics,
      });
    } catch (error: any) {
      this.logger.error(
        `Error fetching role-based analytics: ${error.message}`,
        error.stack
      );
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Error fetching analytics',
      });
    }
  }
}

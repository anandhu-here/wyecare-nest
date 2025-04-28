// timesheets/controllers/timesheets.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../authentication/jwt/jwt-auth.guard';
import { RequirePermission } from '../../authorization/permissions.decorator';
import { OrganizationContextGuard } from '../../organizations/organization-context.guard';
import { TimesheetsService } from '../services/timesheets.service';
import { CreateTimesheetDto } from '../dto/create-timesheet.dto';
import { UpdateTimesheetDto } from '../dto/update-timesheet.dto';
import { Auth } from '../../authorization/auth.decorator';

@Controller('timesheets')
export class TimesheetsController {
  private readonly logger = new Logger(TimesheetsController.name);

  constructor(private readonly timesheetsService: TimesheetsService) {}

  @Get('timesheet-events')
  async addSSEConnection(@Req() req: any, @Res() res: Response) {
    try {
      const { qrCode } = req.query;
      return this.timesheetsService.addSSEConnection(qrCode, req, res);
    } catch (error: any) {
      this.logger.error('Error establishing SSE connection:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  async getTimesheets(
    @Query() query: any,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const { role: accountType, _id } = req.user;
      const orgType = req.currentOrganization?.type;
      const orgId = req.currentOrganization?._id.toString();
      const organizationId = query.organizationId;

      // Pagination parameters
      const page = parseInt(query.page as string) || 1;
      const limit = parseInt(query.limit as string) || 10;

      // Status filters
      const status =
        (query.status as 'all' | 'approved' | 'pending' | 'rejected') || 'all';
      const invoiceStatus = (query.invoiceStatus as string) || null;

      // Additional filters
      const isEmergency = query.isEmergency
        ? query.isEmergency === 'true'
        : null;
      const carerRole = (query.carerRole as string) || 'all';
      const shiftPatternId = (query.shiftPatternId as string) || null;
      const careUserId = (query.careUserId as string) || null;

      // Date range
      let { startDate, endDate } = query;
      if (!startDate || !endDate) {
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split('T')[0];
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          .toISOString()
          .split('T')[0];
      }

      let staffType = 'care';

      if (['admin', 'manager', 'owner'].includes(accountType)) {
        staffType = 'admin';
      }

      const result = await this.timesheetsService.getTimesheetsByRole(
        staffType,
        _id.toString(),
        orgType,
        orgId,
        organizationId,
        { page, limit },
        status,
        startDate,
        endDate,
        invoiceStatus,
        isEmergency,
        carerRole,
        shiftPatternId,
        careUserId
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.log('Error getting timesheets:', error);
      this.logger.error('Error getting timesheets:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to get timesheets',
      });
    }
  }

  //get user timesheet by shift id
  @Get('user/:shiftId')
  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  async getUserTimesheetByShiftId(
    @Param('shiftId') shiftId: string,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const timesheet = await this.timesheetsService.getUserTimesheetByShiftId(
        req.user._id.toString(),
        shiftId
      );

      if (!timesheet) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'Timesheet not found',
        });
      }

      return res.status(HttpStatus.OK).json({
        success: true,
        data: timesheet,
      });
    } catch (error: any) {
      this.logger.error('Error getting user timesheet by shift ID:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to get user timesheet',
      });
    }
  }

  @Get('stats')
  @Auth('view_timesheets')
  async getTimesheetCounts(
    @Query() query: any,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const { startDate, endDate } = query;
      const orgId = req.currentOrganization?._id.toString();

      if (!orgId) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Organization context is required',
        });
      }

      const counts = await this.timesheetsService.getTimesheetCountsByUser(
        orgId,
        req.currentOrganization?.type,
        startDate,
        endDate
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: counts,
      });
    } catch (error: any) {
      this.logger.error('Error getting timesheet counts:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to get timesheet counts',
      });
    }
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  @RequirePermission('view_timesheets')
  async getUserTimesheets(@Query() query: any, @Res() res: Response) {
    try {
      const { userId, startDate, endDate } = query;

      if (!userId || !startDate || !endDate) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'User ID, start date, and end date are required',
        });
      }

      const timesheets = await this.timesheetsService.getUserTimesheets(
        userId,
        startDate,
        endDate
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: timesheets,
      });
    } catch (error: any) {
      this.logger.error('Error getting user timesheets:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to get user timesheets',
      });
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createTimesheet(
    @Body() createTimesheetDto: CreateTimesheetDto,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const { shiftId, shiftPatternId, homeId }: any = createTimesheetDto;

      if (!shiftId) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Shift ID is required',
        });
      }

      const carerId = req.user._id.toString();
      const organizationId =
        req.currentOrganization?.type === 'agency'
          ? req.currentOrganization?._id.toString()
          : null;

      const timesheet = await this.timesheetsService.createTimesheet({
        shiftId,
        userId: carerId,
        shiftPatternId,
        organizationId,
        homeId,
      });

      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Timesheet created successfully',
        data: timesheet,
      });
    } catch (error: any) {
      this.logger.error('Error creating timesheet:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to create timesheet',
      });
    }
  }

  @Post('upload-manual')
  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  async createManualTimesheets(
    @Body() createManualTimesheetsDto: any,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const {
        homeId,
        shiftPatternId,
        carerIds,
        shiftDate,
        temporaryHomeId,
        isTemporaryHome,
      } = createManualTimesheetsDto;

      const createdBy = req.user._id;
      const organizationId = req.currentOrganization?._id.toString();

      const result = await this.timesheetsService.createManualTimesheets({
        homeId,
        shiftPatternId,
        carerIds,
        shiftDate,
        createdBy: createdBy?.toString(),
        agentId: organizationId,
        temporaryHomeId,
        isTemporaryHome,
      });

      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Timesheets created successfully',
        data: result,
      });
    } catch (error: any) {
      this.logger.error('Error creating manual timesheets:', error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to create timesheets',
      });
    }
  }

  @Post('create-for-signature')
  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  async createTimesheetForSignature(
    @Body() createForSignatureDto: any,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const { shiftId, homeId } = createForSignatureDto;
      const { timezone } = req.user;
      const currentOrganization = req.currentOrganization;

      const timesheet =
        await this.timesheetsService.createTimesheetForSignature(
          shiftId,
          req.user._id.toString(),
          currentOrganization?.type === 'agency'
            ? currentOrganization._id.toString()
            : null,
          homeId,
          timezone || 'UTC'
        );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: timesheet,
        message: 'Timesheet created successfully',
      });
    } catch (error: any) {
      this.logger.error('Error creating timesheet for signature:', error);

      return res
        .status(error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({
          success: false,
          message: error.message || 'Failed to create timesheet for signature',
        });
    }
  }

  @Patch(':timesheetId/approve-with-signature')
  @UseGuards(JwtAuthGuard)
  async approveTimesheetWithSignature(
    @Param('timesheetId') timesheetId: string,
    @Body() signatureData: any,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const {
        signatureData: signature,
        signerName,
        signerRole,
        rating,
        review,
      } = signatureData;

      if (!signature) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Signature data is required',
        });
      }

      if (!signerName || !signerRole) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Signer name and role are required',
        });
      }

      // Validate signer role
      const validRoles = ['nurse', 'senior carer', 'manager', 'admin'];
      if (!validRoles.includes(signerRole)) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message:
            'Invalid signer role. Must be one of: nurse, senior carer, manager',
        });
      }

      const updatedTimesheet =
        await this.timesheetsService.approveTimesheetWithSignature(
          timesheetId,
          signature,
          req.user._id.toString(),
          signerName,
          signerRole,
          rating,
          review,
          req.ip,
          req.headers['user-agent']
        );

      if (!updatedTimesheet) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'Timesheet not found',
        });
      }

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Timesheet approved with signature successfully',
        data: updatedTimesheet,
      });
    } catch (error: any) {
      this.logger.error('Error approving timesheet with signature:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to approve timesheet with signature',
      });
    }
  }

  @Patch(':timesheetId/approve')
  @UseGuards(JwtAuthGuard)
  @RequirePermission('approve_timesheets')
  async approveTimesheet(
    @Param('timesheetId') timesheetId: string,
    @Body() approveDto: any,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const { rating, review, barcode } = approveDto;

      const updatedTimesheet = await this.timesheetsService.approveTimesheet(
        timesheetId,
        rating,
        review,
        req.user._id.toString(),
        barcode
      );

      if (!updatedTimesheet) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'Timesheet not found',
        });
      }

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Timesheet approved successfully',
        data: updatedTimesheet,
      });
    } catch (error: any) {
      this.logger.error('Error approving timesheet:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to approve timesheet',
      });
    }
  }

  @Patch(':timesheetId/reject')
  @UseGuards(JwtAuthGuard)
  @RequirePermission('reject_timesheets')
  async rejectTimesheet(
    @Param('timesheetId') timesheetId: string,
    @Body() rejectDto: any,
    @Res() res: Response
  ) {
    try {
      const { reason } = rejectDto;

      const updatedTimesheet = await this.timesheetsService.rejectTimesheet(
        timesheetId,
        reason
      );

      if (!updatedTimesheet) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'Timesheet not found',
        });
      }

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Timesheet rejected successfully',
        data: updatedTimesheet,
      });
    } catch (error: any) {
      this.logger.error('Error rejecting timesheet:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to reject timesheet',
      });
    }
  }

  @Patch('invalidate/:timesheetId')
  @UseGuards(JwtAuthGuard)
  async invalidateTimesheet(
    @Param('timesheetId') timesheetId: string,
    @Res() res: Response
  ) {
    try {
      const result = await this.timesheetsService.invalidateTimesheet(
        timesheetId
      );

      if (!result) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'Timesheet not found',
        });
      }

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Timesheet invalidated successfully',
        data: result,
      });
    } catch (error: any) {
      this.logger.error('Error invalidating timesheet:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to invalidate timesheet',
      });
    }
  }

  @Delete(':timesheetId')
  @UseGuards(JwtAuthGuard)
  @RequirePermission('delete_timesheets')
  async deleteTimesheet(
    @Param('timesheetId') timesheetId: string,
    @Res() res: Response
  ) {
    try {
      const result = await this.timesheetsService.deleteTimesheet(timesheetId);

      if (!result) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'Timesheet not found',
        });
      }

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Timesheet deleted successfully',
      });
    } catch (error: any) {
      this.logger.error('Error deleting timesheet:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to delete timesheet',
      });
    }
  }

  @Post('scan-qr')
  @UseGuards(JwtAuthGuard)
  async scanBarcode(
    @Body() scanBarcodeDto: any,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const { barcode, carerId } = scanBarcodeDto;

      if (!barcode) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Barcode is required',
        });
      }

      const timesheet = await this.timesheetsService.scanBarcode(
        req.user._id.toString(),
        carerId,
        barcode
      );

      if (!timesheet) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'Timesheet not found',
        });
      }

      return res.status(HttpStatus.OK).json({
        success: true,
        data: timesheet,
      });
    } catch (error: any) {
      this.logger.error('Error scanning barcode:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to scan barcode',
      });
    }
  }

  @Get('check-status')
  @UseGuards(JwtAuthGuard)
  @RequirePermission('view_timesheets')
  async checkTimesheetStatus(
    @Query('qrCode') qrCode: string,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      if (!qrCode) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'QR code is required',
        });
      }

      const timesheet = await this.timesheetsService.checkTimesheetStatus(
        req.user._id.toString(),
        qrCode
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: timesheet,
      });
    } catch (error: any) {
      this.logger.error('Error checking timesheet status:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to check timesheet status',
      });
    }
  }
}

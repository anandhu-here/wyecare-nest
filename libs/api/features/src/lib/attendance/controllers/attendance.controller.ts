import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  HttpCode,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../authentication/jwt/jwt-auth.guard';
import { RequirePermission } from '../../authorization/permissions.decorator';
import { AttendanceService } from '../services/attendance.service';
import {
  ClockInDto,
  ClockOutDto,
  ScanQRCodeDto,
  GetAttendanceStatusDto,
  GenerateQRCodeDto,
  ManualUpdateAttendanceDto,
} from '../dto/attendance.dto';
import { Types } from 'mongoose';
import { OrganizationLinkingService } from '../../organizations/services/organization-linking.service';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  private readonly logger = new Logger(AttendanceController.name);

  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly organizationService: OrganizationLinkingService
  ) {}

  /**
   * Server-Sent Events (SSE) connection for attendance events
   */
  @Get('attendance-events')
  async addSSEConnection(
    @Query('qrCode') qrCode: string,
    @Res() res: Response,
    @Req() req: any
  ) {
    if (!qrCode) {
      return res.status(HttpStatus.BAD_REQUEST).send('QR code is required');
    }

    try {
      // Set SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      // Helper function to send messages
      const sendMessage = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
      };

      // Send initial connection message
      sendMessage({ status: 'connected' });

      // Start QR code status monitoring
      const interval = this.attendanceService.monitorQRCodeStatus(
        qrCode,
        (data: any) => {
          sendMessage(data);

          // Close connection if we have a final status
          if (
            ['success', 'error', 'expired', 'timeout'].includes(data.status)
          ) {
            clearInterval(interval);
            res.end();
          }
        }
      );

      // Clean up on client disconnect
      req.on('close', () => {
        clearInterval(interval);
      });

      // Set connection timeout (20 minutes)
      setTimeout(() => {
        sendMessage({ status: 'timeout' });
        clearInterval(interval);
        res.end();
      }, 1200 * 1000);
    } catch (error) {
      this.logger.error(
        `Error setting up SSE connection: ${error.message}`,
        error.stack
      );
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send('Internal server error');
    }
  }

  /**
   * Generate QR code for attendance
   */
  @Post('generate')
  @RequirePermission('create_timesheets')
  async generateQRCode(
    @Body() shiftAssignment: GenerateQRCodeDto,
    @Req() req: any
  ) {
    try {
      const timezone = req.currentOrganization?.timezone || 'Europe/London';
      const qrCode = await this.attendanceService.generateQRCode(
        shiftAssignment,
        timezone
      );

      return {
        success: true,
        data: qrCode,
      };
    } catch (error) {
      this.logger.error(
        `Error generating QR code: ${error.message}`,
        error.stack
      );
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Scan QR code
   */
  @Post('scan')
  async scanQRCode(@Body() scanData: ScanQRCodeDto) {
    try {
      const { barcode, carerId } = scanData;

      if (!carerId || !barcode) {
        throw new BadRequestException('Missing required parameters');
      }

      const attendance = await this.attendanceService.scanQRCode(
        carerId,
        barcode
      );

      return {
        success: true,
        data: attendance,
      };
    } catch (error) {
      this.logger.error(
        `Error scanning QR code: ${error.message}`,
        error.stack
      );
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Check attendance status by QR code
   */
  @Get('check-status')
  async checkStatus(@Query('qrCode') qrCode: string) {
    if (!qrCode) {
      throw new BadRequestException('QR code is required');
    }

    try {
      const attendance = await this.attendanceService.checkAttendanceStatus(
        qrCode
      );

      return {
        success: true,
        data: attendance,
      };
    } catch (error) {
      this.logger.error(`Error checking status: ${error.message}`, error.stack);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get attendance status for a specific date
   */
  @Get('status')
  async getAttendanceStatus(
    @Query() query: GetAttendanceStatusDto,
    @Req() req: any
  ) {
    try {
      const userId = req.user._id.toString();
      const { day, month, year } = query;

      // Create date from parameters
      const queryDate = `${year}-${month}-${day}`;
      if (!this.isValidDate(queryDate)) {
        throw new BadRequestException('Invalid date parameters');
      }

      const date = new Date(queryDate);
      const attendance = await this.attendanceService.getAttendanceStatusByDate(
        userId,
        date
      );

      return {
        success: true,
        data: attendance,
      };
    } catch (error) {
      this.logger.error(
        `Error getting attendance status: ${error.message}`,
        error.stack
      );
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Generate workplace QR codes
   */
  @Get('workplace/:workplaceId/qr')
  async generateWorkplaceQRs(@Param('workplaceId') workplaceId: string) {
    if (!workplaceId) {
      throw new BadRequestException('Workplace ID is required');
    }

    try {
      const qrCodes = await this.attendanceService.generateWorkplaceQRCodes(
        workplaceId
      );

      return {
        success: true,
        data: qrCodes,
      };
    } catch (error) {
      this.logger.error(
        `Error generating workplace QRs: ${error.message}`,
        error.stack
      );
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Clock in
   */
  @Post('clock-in')
  async clockIn(@Body() clockInDto: ClockInDto, @Req() req: any) {
    try {
      const userId = req.user._id.toString();
      const timezone = req.user?.timezone || 'UTC';
      const { qrCode, deviceId, location } = clockInDto;

      this.logger.debug(
        `Clock In Request - UserID: ${userId}, Timezone: ${timezone}`
      );

      // Input validation
      if (!qrCode) {
        throw new BadRequestException('QR code is required');
      }

      // Check for existing active session
      const existingSession = await this.attendanceService.getCurrentAttendance(
        userId
      );
      if (existingSession?.status === 'signedIn') {
        this.logger.log(
          `User already has active session - Attendance ID: ${existingSession._id}`
        );
        throw new ConflictException({
          success: false,
          message: 'Already clocked in for an active shift',
          code: 'ALREADY_CLOCKED_IN',
          data: existingSession,
        });
      }

      // Validate QR code
      let qrPayload;
      try {
        qrPayload = await this.attendanceService.validateQRCode(qrCode);
      } catch (error) {
        throw new BadRequestException('Invalid or expired QR code');
      }

      // Validate QR type
      if (qrPayload.type !== 'IN') {
        throw new BadRequestException('Invalid QR code type for clock in');
      }

      // Build clock in data
      const clockInData = {
        userId,
        workplaceId: qrPayload.workplaceId,
        timezone,
        metadata: {
          deviceId,
          location,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
          timestamp: new Date(),
        },
      };

      // Process clock in
      const attendance = await this.attendanceService.processClockIn(
        clockInData
      );

      return {
        success: true,
        data: attendance,
        message: 'Successfully clocked in',
        timestamp: new Date(),
      };
    } catch (error) {
      // If it's already a HTTP exception, rethrow it
      if (error.status) {
        throw error;
      }

      // Handle specific error codes
      if (error.code === 'DUPLICATE_CLOCK_IN') {
        throw new ConflictException('Already clocked in');
      }

      this.logger.error(
        `Unhandled exception in clockIn controller: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException(
        error.message || 'Failed to process clock in'
      );
    }
  }

  /**
   * Clock out
   */
  @Post('clock-out')
  async clockOut(@Body() clockOutDto: ClockOutDto, @Req() req: any) {
    try {
      const userId = req.user._id.toString();
      const timezone = req.user?.timezone || 'UTC';
      const { qrCode, deviceId, location } = clockOutDto;

      // Input validation
      if (!qrCode) {
        throw new BadRequestException('QR code is required');
      }

      // Check for active session
      const activeSession = await this.attendanceService.getCurrentAttendance(
        userId
      );
      if (!activeSession || activeSession.status !== 'signedIn') {
        throw new ConflictException('No active clock-in session found');
      }

      // Validate QR code
      let qrPayload;
      try {
        qrPayload = await this.attendanceService.validateQRCode(qrCode);
      } catch (error) {
        throw new BadRequestException('Invalid or expired QR code');
      }

      // Validate workplace matches
      if (qrPayload.workplaceId !== activeSession.workplace.toString()) {
        throw new BadRequestException(
          'QR code does not match clock-in workplace'
        );
      }

      // Process clock out
      const clockOutData = {
        userId,
        workplaceId: qrPayload.workplaceId,
        timezone,
        metadata: {
          deviceId,
          location,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
          timestamp: new Date(),
        },
      };

      const attendance = await this.attendanceService.processClockOut(
        clockOutData
      );

      return {
        success: true,
        data: attendance,
        message: 'Successfully clocked out',
        timestamp: new Date(),
      };
    } catch (error) {
      // If it's already a HTTP exception, rethrow it
      if (error.status) {
        throw error;
      }

      this.logger.error(
        `Error in clockOut controller: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException(
        error.message || 'Failed to process clock out'
      );
    }
  }

  /**
   * Get workplace attendance
   */
  @Get('workplace/:workplaceId/attendance')
  async getWorkplaceAttendance(
    @Param('workplaceId') workplaceId: string,
    @Query('date') date: string,
    @Req() req: any
  ) {
    try {
      if (!workplaceId) {
        throw new BadRequestException('Workplace ID is required');
      }

      const timezone = req.user?.timezone || 'Europe/London';
      const attendanceDate = date ? new Date(date) : new Date();

      const attendanceData =
        await this.attendanceService.getWorkplaceAttendance(
          workplaceId,
          attendanceDate,
          timezone
        );

      return {
        success: true,
        data: attendanceData,
      };
    } catch (error) {
      this.logger.error(
        `Error getting workplace attendance: ${error.message}`,
        error.stack
      );
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get attendance scanner data
   */
  @Get('attendance/scan')
  async showScanner(@Req() req: any) {
    try {
      const userId = req.user._id.toString();
      const currentDate = new Date();
      const timezone = req.user?.timezone || 'Europe/London';

      // Get user's current attendance status
      const currentAttendance =
        await this.attendanceService.getCurrentAttendance(userId);

      // Get user's shift information for today
      const userShift = await this.attendanceService.getUserShiftForDate(
        userId,
        currentDate,
        timezone
      );

      return {
        success: true,
        data: {
          currentAttendance,
          userShift,
          user: {
            id: userId,
            name: req.user?.firstName,
            role: req.user?.role,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Error showing scanner: ${error.message}`, error.stack);
      throw new BadRequestException(error.message || 'Failed to load scanner');
    }
  }

  /**
   * Get attendance registry
   */
  @Get('registry')
  async getAttendanceRegistry(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('staffType') staffType: string,
    @Query('agencyId') agencyId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Req() req: any
  ) {
    try {
      // Validate date parameters
      if (!startDate || !endDate) {
        throw new BadRequestException('Start date and end date are required');
      }

      // Ensure page and limit are positive numbers
      const currentPage = Math.max(1, Number(page));
      const pageSize = Math.max(1, Number(limit));

      const workplace = req.currentOrganization;

      // Validate workplace
      if (!workplace || !workplace._id) {
        throw new BadRequestException(
          'Current organization context is required'
        );
      }

      const result = await this.attendanceService.getAttendanceRegistry({
        workplaceId: workplace._id.toString(),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        staffType,
        agencyId,
        page: currentPage,
        limit: pageSize,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error(
        `Error getting attendance registry: ${error.message}`,
        error.stack
      );
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get linked agencies for a home/organization
   */
  @Get('organizations/:homeId/linked-agencies')
  async getLinkedAgencies(@Param('homeId') homeId: string) {
    try {
      if (!Types.ObjectId.isValid(homeId)) {
        throw new BadRequestException('Invalid home ID');
      }

      const agencies = await this.organizationService.getLinkedOrganizations(
        homeId as any
      );

      return {
        success: true,
        data: agencies,
      };
    } catch (error) {
      this.logger.error(
        `Error getting linked agencies: ${error.message}`,
        error.stack
      );
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Update attendance record manually (admin function)
   */
  @Patch(':attendanceId/manual-update')
  @RequirePermission('manage_attendance')
  async updateAttendanceManually(
    @Param('attendanceId') attendanceId: string,
    @Body() updateDto: ManualUpdateAttendanceDto,
    @Req() req: any
  ) {
    try {
      if (!Types.ObjectId.isValid(attendanceId)) {
        throw new BadRequestException('Invalid attendance ID');
      }

      const { signInTime, signOutTime, status, reason } = updateDto;

      if (!reason) {
        throw new BadRequestException('Reason is required for manual updates');
      }

      const adminUser = req.user;
      const currentOrganization = req.currentOrganization;

      const updatedAttendance =
        await this.attendanceService.updateAttendanceManually({
          attendanceId,
          signInTime,
          signOutTime,
          status,
          reason,
          adminUser,
          currentOrganization,
        });

      return {
        success: true,
        data: updatedAttendance,
        message: 'Attendance record updated successfully',
      };
    } catch (error) {
      this.logger.error(
        `Error updating attendance manually: ${error.message}`,
        error.stack
      );
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Utility to validate date strings
   */
  private isValidDate(dateStr: string): boolean {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }
}

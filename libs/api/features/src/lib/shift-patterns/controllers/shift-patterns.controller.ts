import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Req,
  Logger,
} from '@nestjs/common';
import { ShiftPatternsService } from '../services/shift-patterns.service';
import { CreateShiftPatternDto } from '../dto/create-shift-pattern.dto';
import { UpdateShiftPatternDto } from '../dto/update-shift-pattern.dto';
import { JwtAuthGuard } from '../../authentication/jwt/jwt-auth.guard';
import { PermissionGuard } from '../../authorization/permission.guard';
import { DateTime } from 'luxon';
import { Auth } from '../../authorization/auth.decorator';
import { OrganizationContextGuard } from '../../organizations/organization-context.guard';
import { CreateAgencyShiftPatternDto } from '../dto/reate-agency-shift-pattern.dto';

@Controller('shift-patterns')
@UseGuards(JwtAuthGuard)
export class ShiftPatternsController {
  private readonly logger = new Logger(ShiftPatternsController.name);

  constructor(private readonly shiftPatternsService: ShiftPatternsService) {}

  @Post()
  @UseGuards(PermissionGuard)
  @Auth('create_shift_pattern')
  async create(
    @Body()
    createShiftPatternDto: CreateShiftPatternDto | CreateAgencyShiftPatternDto,
    @Req() req: any
  ) {
    try {
      const userTimezone = req.user.timezone || 'Europe/London';
      const organizationId = req.currentOrganization._id.toString();
      const organizationType = req.currentOrganization.type;

      // Convert timings from user timezone to server timezone (Europe/London)
      const convertedDto = {
        ...createShiftPatternDto,
        timings: this.convertTimingsToServerTime(
          createShiftPatternDto.timings as any,
          userTimezone
        ),
      };

      let result;

      // Check if the organization is an agency
      if (organizationType === 'agency') {
        // Call the agency-specific service method
        result = await this.shiftPatternsService.createAgencyShiftPattern(
          convertedDto as CreateAgencyShiftPatternDto,
          organizationId
        );
      } else {
        // Call the standard service method for other organization types
        result = await this.shiftPatternsService.create(
          convertedDto,
          organizationId
        );
      }

      // Convert timings back to user timezone for response
      return {
        ...result.toJSON(),
        timings: this.convertTimingsToUserTime(
          result.timings as any,
          userTimezone
        ),
      };
    } catch (error: any) {
      this.logger.error(
        `Error creating shift pattern: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Post('agency')
  @Auth('create_shift_pattern')
  async createAgencyShiftPattern(
    @Body() createAgencyShiftPatternDto: CreateAgencyShiftPatternDto,
    @Req() req: any
  ) {
    try {
      const userTimezone = req.user.timezone || 'Europe/London';
      const organizationId = req.currentOrganization._id.toString();

      // Convert timings from user timezone to server timezone
      const convertedDto = {
        ...createAgencyShiftPatternDto,
        timings: this.convertTimingsToServerTime(
          createAgencyShiftPatternDto.timings,
          userTimezone
        ),
      };

      const result = await this.shiftPatternsService.createAgencyShiftPattern(
        convertedDto,
        organizationId
      );

      // Convert timings back to user timezone for response
      return {
        ...result.toJSON(),
        timings: this.convertTimingsToUserTime(
          result.timings as any,
          userTimezone
        ),
      };
    } catch (error: any) {
      this.logger.error(
        `Error creating agency shift pattern: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  async findAll(@Req() req: any) {
    try {
      const userTimezone = req.user.timezone || 'Europe/London';
      const organizationId = req.currentOrganization._id.toString();

      const results = await this.shiftPatternsService.findAll(organizationId);

      // Convert all timings back to user timezone for response
      return results.map((pattern) => ({
        ...pattern,
      }));
    } catch (error: any) {
      this.logger.error(
        `Error finding all shift patterns: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Get('other/:orgId')
  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  async findByUserId(@Param('orgId') orgId: string, @Req() req: any) {
    try {
      const userTimezone = req.user.timezone || 'Europe/London';

      const results = await this.shiftPatternsService.findAll(orgId);

      // Convert all timings back to user timezone for response
      return results.map((pattern) => ({
        ...pattern,
        timings: this.convertTimingsToUserTime(
          pattern.timings as any,
          userTimezone
        ),
      }));
    } catch (error: any) {
      this.logger.error(
        `Error finding shift patterns by user ID: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  async findOne(@Param('id') id: string, @Req() req: any) {
    try {
      const userTimezone = req.user.timezone || 'Europe/London';
      const organizationId = req.currentOrganization._id.toString();

      const result = await this.shiftPatternsService.findOne(
        id,
        organizationId
      );

      // Convert timings back to user timezone for response
      return {
        ...result.toJSON(),
        timings: this.convertTimingsToUserTime(
          result.timings as any,
          userTimezone
        ),
      };
    } catch (error: any) {
      this.logger.error(
        `Error finding shift pattern: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Put(':id')
  @Auth('edit_shift_pattern')
  async update(
    @Param('id') id: string,
    @Body() updateShiftPatternDto: UpdateShiftPatternDto,
    @Req() req: any
  ) {
    try {
      const userTimezone = req.user.timezone || 'Europe/London';
      const organizationId = req.currentOrganization._id.toString();

      // Convert timings from user timezone to server timezone (Europe/London)
      const convertedDto = {
        ...updateShiftPatternDto,
        timings: this.convertTimingsToServerTime(
          updateShiftPatternDto.timings as any,
          userTimezone
        ),
      };

      const result = await this.shiftPatternsService.update(
        id,
        organizationId,
        convertedDto
      );

      // Convert timings back to user timezone for response
      return {
        ...result.toJSON(),
        timings: this.convertTimingsToUserTime(
          result.timings as any,
          userTimezone
        ),
      };
    } catch (error: any) {
      this.logger.error(
        `Error updating shift pattern: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Delete(':id')
  @Auth('delete_shift_pattern')
  async remove(@Param('id') id: string, @Req() req: any) {
    try {
      const organizationId = req.currentOrganization._id.toString();
      return await this.shiftPatternsService.remove(id, organizationId);
    } catch (error: any) {
      this.logger.error(
        `Error removing shift pattern: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  // Helper methods for timezone conversion
  private convertTimingsToServerTime(timings: any[], userTimezone: string) {
    if (!timings || !Array.isArray(timings)) return timings;

    return timings.map((timing) => {
      const startDateTime = DateTime.fromFormat(timing.startTime, 'HH:mm', {
        zone: userTimezone,
      });
      const endDateTime = DateTime.fromFormat(timing.endTime, 'HH:mm', {
        zone: userTimezone,
      });

      const convertedStart = startDateTime.setZone('Europe/London');
      const convertedEnd = endDateTime.setZone('Europe/London');

      return {
        ...timing,
        startTime: convertedStart.toFormat('HH:mm'),
        endTime: convertedEnd.toFormat('HH:mm'),
        originalTimezone: userTimezone,
      };
    });
  }

  private convertTimingsToUserTime(timings: any[], userTimezone: string) {
    if (!timings || !Array.isArray(timings)) return timings;

    return timings.map((timing) => {
      const serverStart = DateTime.fromFormat(timing.startTime, 'HH:mm', {
        zone: 'Europe/London',
      });
      const serverEnd = DateTime.fromFormat(timing.endTime, 'HH:mm', {
        zone: 'Europe/London',
      });

      const userStart = serverStart.setZone(userTimezone);
      const userEnd = serverEnd.setZone(userTimezone);

      return {
        ...timing,
        startTime: userStart.toFormat('HH:mm'),
        endTime: userEnd.toFormat('HH:mm'),
      };
    });
  }
}

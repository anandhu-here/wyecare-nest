// libs/api/features/src/lib/shifts/controllers/shift-types.controller.ts
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
  Query,
} from '@nestjs/common';
import { ShiftTypesService } from '../services/shift-types.service';
import { CreateShiftTypeDto } from '../dto/create-shift-type.dto';
import { UpdateShiftTypeDto } from '../dto/update-shift-type.dto';
import { JwtAuthGuard } from '../../authentication/jwt/jwt-auth.guard';
import { PermissionGuard } from '../../authorization/permission.guard';
import { Auth } from '../../authorization/auth.decorator';
import { OrganizationContextGuard } from '../../organizations/organization-context.guard';
import { DateTime } from 'luxon';
import { ApplyTemplateDto } from '../dto/apply-template.dto';

@Controller('shift-types')
@UseGuards(JwtAuthGuard)
export class ShiftTypesController {
  private readonly logger = new Logger(ShiftTypesController.name);

  constructor(private readonly shiftTypesService: ShiftTypesService) {}

  @Post()
  @UseGuards(PermissionGuard)
  @Auth('create_shift_type')
  async create(
    @Body() createShiftTypeDto: CreateShiftTypeDto,
    @Req() req: any
  ) {
    try {
      const userTimezone = req.user.timezone || 'Europe/London';
      const organizationId = req.currentOrganization._id.toString();
      const organizationCategory = req.currentOrganization.category;

      // If category not provided, use the organization's category
      if (!createShiftTypeDto.category) {
        createShiftTypeDto.category = organizationCategory;
      }

      // Convert timing from user timezone to server timezone (Europe/London)
      const convertedDto = {
        ...createShiftTypeDto,
        organizationId,
        defaultTiming: createShiftTypeDto.defaultTiming
          ? this.convertTimingToServerTime(
              createShiftTypeDto.defaultTiming,
              userTimezone
            )
          : undefined,
      };

      const result = await this.shiftTypesService.create(convertedDto);

      // Convert timing back to user timezone for response
      return {
        ...result.toJSON(),
        defaultTiming: result.defaultTiming
          ? this.convertTimingToUserTime(result.defaultTiming, userTimezone)
          : undefined,
      };
    } catch (error: any) {
      this.logger.error(
        `Error creating shift type: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  async findAll(@Req() req: any, @Query() query: any) {
    try {
      const userTimezone = req.user.timezone || 'Europe/London';
      const organizationId = req.currentOrganization._id.toString();

      // Get query parameters
      const { category, isActive, search } = query;

      const results = await this.shiftTypesService.findAll(organizationId, {
        category,
        isActive: isActive === 'true',
        search,
      });

      // Convert all timings back to user timezone for response
      return results.map((shiftType) => ({
        ...shiftType,
        defaultTiming: shiftType.defaultTiming
          ? this.convertTimingToUserTime(shiftType.defaultTiming, userTimezone)
          : undefined,
      }));
    } catch (error: any) {
      this.logger.error(
        `Error finding all shift types: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Get('templates')
  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  async getTemplates(@Req() req: any, @Query('category') category?: string) {
    try {
      const userTimezone = req.user.timezone || 'Europe/London';
      const organizationCategory = req.currentOrganization.category;

      // Use organization category if not specified
      const targetCategory = category || organizationCategory;

      const templates = await this.shiftTypesService.getShiftTemplates(
        targetCategory
      );

      // Convert all timings back to user timezone for response
      return templates.map((template) => ({
        ...template,
        defaultTiming: template.defaultTiming
          ? this.convertTimingToUserTime(template.defaultTiming, userTimezone)
          : undefined,
      }));
    } catch (error: any) {
      this.logger.error(
        `Error getting shift templates: ${error.message}`,
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

      const result = await this.shiftTypesService.findOne(id, organizationId);

      // Convert timing back to user timezone for response
      return {
        ...result.toJSON(),
        defaultTiming: result.defaultTiming
          ? this.convertTimingToUserTime(result.defaultTiming, userTimezone)
          : undefined,
      };
    } catch (error: any) {
      this.logger.error(
        `Error finding shift type: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Put(':id')
  @Auth('edit_shift_type')
  async update(
    @Param('id') id: string,
    @Body() updateShiftTypeDto: UpdateShiftTypeDto,
    @Req() req: any
  ) {
    try {
      const userTimezone = req.user.timezone || 'Europe/London';
      const organizationId = req.currentOrganization._id.toString();

      // Convert timing from user timezone to server timezone (Europe/London)
      const convertedDto = {
        ...updateShiftTypeDto,
        defaultTiming: updateShiftTypeDto.defaultTiming
          ? this.convertTimingToServerTime(
              updateShiftTypeDto.defaultTiming,
              userTimezone
            )
          : undefined,
      };

      const result = await this.shiftTypesService.update(
        id,
        organizationId,
        convertedDto
      );

      // Convert timing back to user timezone for response
      return {
        ...result.toJSON(),
        defaultTiming: result.defaultTiming
          ? this.convertTimingToUserTime(result.defaultTiming, userTimezone)
          : undefined,
      };
    } catch (error: any) {
      this.logger.error(
        `Error updating shift type: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Delete(':id')
  @Auth('delete_shift_type')
  async remove(@Param('id') id: string, @Req() req: any) {
    try {
      const organizationId = req.currentOrganization._id.toString();
      return await this.shiftTypesService.remove(id, organizationId);
    } catch (error: any) {
      this.logger.error(
        `Error removing shift type: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Post('apply-template')
  @UseGuards(PermissionGuard)
  @Auth('create_shift_type')
  async applyTemplate(
    @Body() applyTemplateDto: ApplyTemplateDto,
    @Req() req: any
  ) {
    try {
      const userTimezone = req.user.timezone || 'Europe/London';
      const organizationId = req.currentOrganization._id.toString();

      // Convert timing from user timezone to server timezone if provided
      const convertedDto = {
        ...applyTemplateDto,
        defaultTiming: applyTemplateDto.defaultTiming
          ? this.convertTimingToServerTime(
              applyTemplateDto.defaultTiming,
              userTimezone
            )
          : undefined,
      };

      const result = await this.shiftTypesService.applyTemplate(
        applyTemplateDto.templateId,
        organizationId,
        convertedDto
      );

      // Convert timing back to user timezone for response
      return {
        ...result.toJSON(),
        defaultTiming: result.defaultTiming
          ? this.convertTimingToUserTime(result.defaultTiming, userTimezone)
          : undefined,
      };
    } catch (error: any) {
      this.logger.error(
        `Error applying shift template: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  // Helper methods for timezone conversion
  private convertTimingToServerTime(timing: any, userTimezone: string) {
    if (!timing) return timing;

    const startDateTime = DateTime.fromFormat(timing.startTime, 'HH:mm', {
      zone: userTimezone,
    });
    const endDateTime = DateTime.fromFormat(timing.endTime, 'HH:mm', {
      zone: userTimezone,
    });

    const convertedStart = startDateTime.setZone('Europe/London');
    const convertedEnd = endDateTime.setZone('Europe/London');

    // Calculate duration in minutes
    const durationMinutes = this.calculateDurationMinutes(
      convertedStart.toFormat('HH:mm'),
      convertedEnd.toFormat('HH:mm'),
      timing.isOvernight
    );

    return {
      ...timing,
      startTime: convertedStart.toFormat('HH:mm'),
      endTime: convertedEnd.toFormat('HH:mm'),
      durationMinutes,
      originalTimezone: userTimezone,
    };
  }

  private convertTimingToUserTime(timing: any, userTimezone: string) {
    if (!timing) return timing;

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
  }

  // Helper to calculate duration in minutes
  private calculateDurationMinutes(
    startTime: string,
    endTime: string,
    isOvernight: boolean
  ): number {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    let startMinutes = startHour * 60 + startMinute;
    let endMinutes = endHour * 60 + endMinute;

    if (isOvernight && endMinutes <= startMinutes) {
      // If it's an overnight shift, add 24 hours to end time
      endMinutes += 24 * 60;
    }

    return endMinutes - startMinutes;
  }
}

// libs/api/features/src/lib/shifts/controllers/scheduling-rules.controller.ts
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

import { JwtAuthGuard } from '../../authentication/jwt/jwt-auth.guard';
import { PermissionGuard } from '../../authorization/permission.guard';
import { Auth } from '../../authorization/auth.decorator';
import { OrganizationContextGuard } from '../../organizations/organization-context.guard';
import { CreateSchedulingRuleDto } from '../dto/create-scheduling-rule.dto';
import { UpdateSchedulingRuleDto } from '../dto/update-scheduling-rule.dto';
import { SchedulingRulesService } from '../services/scheduling-rules.service';

@Controller('scheduling-rules')
@UseGuards(JwtAuthGuard)
export class SchedulingRulesController {
  private readonly logger = new Logger(SchedulingRulesController.name);

  constructor(
    private readonly schedulingRulesService: SchedulingRulesService
  ) {}

  @Post()
  @UseGuards(PermissionGuard)
  @Auth('create_scheduling_rule')
  async create(
    @Body() createSchedulingRuleDto: CreateSchedulingRuleDto,
    @Req() req: any
  ) {
    try {
      const organizationId = req.currentOrganization._id.toString();
      const organizationCategory = req.currentOrganization.category;

      // If category not provided, use the organization's category
      if (!createSchedulingRuleDto.category) {
        createSchedulingRuleDto.category = organizationCategory;
      }

      const result = await this.schedulingRulesService.create({
        ...createSchedulingRuleDto,
        organizationId,
      });

      return result;
    } catch (error: any) {
      this.logger.error(
        `Error creating scheduling rule: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  async findAll(@Req() req: any, @Query() query: any) {
    try {
      const organizationId = req.currentOrganization._id.toString();

      // Get query parameters
      const { ruleType, scope, isActive, search } = query;

      const results = await this.schedulingRulesService.findAll(
        organizationId,
        {
          ruleType,
          scope,
          isActive: isActive === 'true',
          search,
        }
      );

      return results;
    } catch (error: any) {
      this.logger.error(
        `Error finding all scheduling rules: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Get('templates')
  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  async getTemplates(@Req() req: any, @Query('category') category?: string) {
    try {
      const organizationCategory = req.currentOrganization.category;

      // Use organization category if not specified
      const targetCategory = category || organizationCategory;

      const templates =
        await this.schedulingRulesService.getSystemRuleTemplates(
          targetCategory
        );

      return templates;
    } catch (error: any) {
      this.logger.error(
        `Error getting rule templates: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  async findOne(@Param('id') id: string, @Req() req: any) {
    try {
      const organizationId = req.currentOrganization._id.toString();

      const result = await this.schedulingRulesService.findOne(
        id,
        organizationId
      );

      return result;
    } catch (error: any) {
      this.logger.error(
        `Error finding scheduling rule: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Put(':id')
  @Auth('edit_scheduling_rule')
  async update(
    @Param('id') id: string,
    @Body() updateSchedulingRuleDto: UpdateSchedulingRuleDto,
    @Req() req: any
  ) {
    try {
      const organizationId = req.currentOrganization._id.toString();

      const result = await this.schedulingRulesService.update(
        id,
        organizationId,
        updateSchedulingRuleDto
      );

      return result;
    } catch (error: any) {
      this.logger.error(
        `Error updating scheduling rule: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Delete(':id')
  @Auth('delete_scheduling_rule')
  async remove(@Param('id') id: string, @Req() req: any) {
    try {
      const organizationId = req.currentOrganization._id.toString();
      return await this.schedulingRulesService.remove(id, organizationId);
    } catch (error: any) {
      this.logger.error(
        `Error removing scheduling rule: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Post('apply-templates')
  @UseGuards(PermissionGuard)
  @Auth('create_scheduling_rule')
  async applyTemplates(@Req() req: any) {
    try {
      const organizationId = req.currentOrganization._id.toString();
      const organizationCategory = req.currentOrganization.category;

      const results =
        await this.schedulingRulesService.applySystemRulesToOrganization(
          organizationId,
          organizationCategory
        );

      return {
        message: `Successfully applied ${results.length} system rules`,
        rules: results,
      };
    } catch (error: any) {
      this.logger.error(
        `Error applying rule templates: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}

// libs/api/features/src/lib/shifts/controllers/rotation-patterns.controller.ts
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
import { CreateRotationPatternDto } from '../dto/create-rotation-pattern.dto';
import { UpdateRotationPatternDto } from '../dto/update-rotation-pattern.dto';
import { RotationPatternsService } from '../services/rotation-patterns.service';

@Controller('rotation-patterns')
@UseGuards(JwtAuthGuard)
export class RotationPatternsController {
  private readonly logger = new Logger(RotationPatternsController.name);

  constructor(
    private readonly rotationPatternsService: RotationPatternsService
  ) {}

  @Post()
  @UseGuards(PermissionGuard)
  @Auth('create_rotation_pattern')
  async create(
    @Body() createRotationPatternDto: CreateRotationPatternDto,
    @Req() req: any
  ) {
    try {
      const organizationId = req.currentOrganization._id.toString();
      const organizationCategory = req.currentOrganization.category;

      // If category not provided, use the organization's category
      if (!createRotationPatternDto.category) {
        createRotationPatternDto.category = organizationCategory;
      }

      const result = await this.rotationPatternsService.create({
        ...createRotationPatternDto,
        organizationId,
      });

      return result;
    } catch (error: any) {
      this.logger.error(
        `Error creating rotation pattern: ${error.message}`,
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
      const { isActive, search } = query;

      const results = await this.rotationPatternsService.findAll(
        organizationId,
        {
          isActive: isActive === 'true',
          search,
        }
      );

      return results;
    } catch (error: any) {
      this.logger.error(
        `Error finding all rotation patterns: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Get('templates')
  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  async getTemplates(
    @Req() req: any,
    @Query('patternType') patternType: string
  ) {
    try {
      const organizationCategory = req.currentOrganization.category;

      const template =
        await this.rotationPatternsService.getRotationPatternTemplate(
          organizationCategory,
          patternType || 'basic'
        );

      return template;
    } catch (error: any) {
      this.logger.error(
        `Error getting rotation pattern template: ${error.message}`,
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

      const result = await this.rotationPatternsService.findOne(
        id,
        organizationId
      );

      return result;
    } catch (error: any) {
      this.logger.error(
        `Error finding rotation pattern: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Put(':id')
  @Auth('edit_rotation_pattern')
  async update(
    @Param('id') id: string,
    @Body() updateRotationPatternDto: UpdateRotationPatternDto,
    @Req() req: any
  ) {
    try {
      const organizationId = req.currentOrganization._id.toString();

      const result = await this.rotationPatternsService.update(
        id,
        organizationId,
        updateRotationPatternDto
      );

      return result;
    } catch (error: any) {
      this.logger.error(
        `Error updating rotation pattern: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Delete(':id')
  @Auth('delete_rotation_pattern')
  async remove(@Param('id') id: string, @Req() req: any) {
    try {
      const organizationId = req.currentOrganization._id.toString();
      return await this.rotationPatternsService.remove(id, organizationId);
    } catch (error: any) {
      this.logger.error(
        `Error removing rotation pattern: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}

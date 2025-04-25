import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpStatus,
  Res,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../authentication/jwt/jwt-auth.guard';
import { RequirePermission } from '../../authorization/permissions.decorator';
import {
  CreateTemporaryHomeDto,
  UpdateTemporaryHomeDto,
  ClaimTemporaryHomeDto,
  UnclaimTemporaryHomeDto,
} from '../dto/temp-home.dto';
import { OrganizationContextGuard } from '../../organizations/organization-context.guard';
import { TemporaryHomeService } from '../services/temp-organization.service';

@Controller('temporary-homes')
@UseGuards(JwtAuthGuard, OrganizationContextGuard)
export class TemporaryHomeController {
  constructor(private readonly temporaryHomeService: TemporaryHomeService) {}

  /**
   * Create a new temporary care home
   */
  @Post()
  @RequirePermission('manage_temporary_homes')
  async createTemporaryHome(
    @Body() createDto: CreateTemporaryHomeDto,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const agencyId = req.currentOrganization._id.toString();
      const createdBy = req.user._id.toString();

      const tempHome = await this.temporaryHomeService.createTemporaryHome({
        name: createDto.name,
        agencyId,
        createdBy,
      });

      return res.status(HttpStatus.CREATED).json({
        success: true,
        data: tempHome,
        message: 'Temporary care home created successfully',
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get all temporary homes created by an agency
   */
  @Get()
  @RequirePermission('view_temporary_homes')
  async getAgencyTemporaryHomes(@Req() req: any, @Res() res: Response) {
    try {
      const agencyId = req.currentOrganization._id.toString();

      const tempHomes = await this.temporaryHomeService.getAgencyTemporaryHomes(
        agencyId
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: tempHomes,
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get temporary home details by ID
   */
  @Get(':id')
  @RequirePermission('view_temporary_homes')
  async getTemporaryHomeById(@Param('id') id: string, @Res() res: Response) {
    try {
      const tempHome = await this.temporaryHomeService.getTemporaryHomeById(id);

      return res.status(HttpStatus.OK).json({
        success: true,
        data: tempHome,
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get temporary home by its unique temporary ID
   */
  @Get('temp/:temporaryId')
  @RequirePermission('view_temporary_homes')
  async getTemporaryHomeByTempId(
    @Param('temporaryId') temporaryId: string,
    @Res() res: Response
  ) {
    try {
      const tempHome = await this.temporaryHomeService.getTemporaryHomeByTempId(
        temporaryId
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: tempHome,
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Update temporary home details
   */
  @Put()
  @RequirePermission('manage_temporary_homes')
  async updateTemporaryHome(
    @Body() updateDto: UpdateTemporaryHomeDto,
    @Res() res: Response
  ) {
    try {
      const tempHome = await this.temporaryHomeService.updateTemporaryHome({
        tempHomeId: updateDto.tempHomeId,
        name: updateDto.name,
        metadata: updateDto.metadata,
      });

      return res.status(HttpStatus.OK).json({
        success: true,
        data: tempHome,
        message: 'Temporary home updated successfully',
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Delete a temporary home
   */
  @Delete(':tempHomeId')
  @RequirePermission('manage_temporary_homes')
  async deleteTemporaryHome(
    @Param('tempHomeId') tempHomeId: string,
    @Res() res: Response
  ) {
    try {
      await this.temporaryHomeService.deleteTemporaryHome(tempHomeId);

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Temporary home deleted successfully',
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Claim a temporary home and migrate its data
   */
  @Post('claim')
  @RequirePermission('claim_temporary_home')
  async claimTemporaryHome(
    @Body() claimDto: ClaimTemporaryHomeDto,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const homeId = req.currentOrganization._id.toString();

      const result = await this.temporaryHomeService.claimTemporaryHome({
        temporaryId: claimDto.temporaryId,
        homeId,
      });

      return res.status(HttpStatus.OK).json({
        success: true,
        data: result,
        message: 'Temporary home claimed successfully',
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Unclaim a temporary home
   */
  @Post(':id/unclaim')
  @RequirePermission('manage_temporary_homes')
  async unclaimTemporaryHome(
    @Param('id') tempHomeId: string,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const organizationId = req.currentOrganization._id.toString();

      // Use organization type to determine if it's an agency
      const isAgency = req.currentOrganization.type === 'agency';

      const result = await this.temporaryHomeService.unclaimTemporaryHome({
        tempHomeId,
        agency: isAgency,
        requestingOrgId: organizationId,
      });

      return res.status(HttpStatus.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Verify if a temporary ID is valid and available to claim
   */
  @Get('verify-claiming-token')
  async verifyTemporaryId(
    @Query('temporaryId') temporaryId: string,
    @Res() res: Response
  ) {
    try {
      if (!temporaryId) {
        throw new BadRequestException('Temporary ID is required');
      }

      const result = await this.temporaryHomeService.verifyTemporaryId(
        temporaryId
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get statistics about a temporary home
   */
  @Get('stats/:tempHomeId')
  @RequirePermission('view_temporary_homes')
  async getTemporaryHomeStats(
    @Param('tempHomeId') tempHomeId: string,
    @Res() res: Response
  ) {
    try {
      const stats = await this.temporaryHomeService.getTemporaryHomeStats(
        tempHomeId
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}

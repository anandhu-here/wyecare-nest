// employee-application.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  HttpStatus,
  Res,
  UploadedFile,
  UseInterceptors,
  ParseIntPipe,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UploadedFiles,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../authentication/jwt/jwt-auth.guard';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Logger } from '@nestjs/common';
import { UsersService } from '../../users/services/users.service';
import { OrganizationContextGuard } from '../../organizations/organization-context.guard';
import {
  AddToArrayDto,
  GetAgencyApplicationDto,
  UpdateSectionDto,
  UploadDocumentDto,
} from '../dto/base-application.dto';
import { EmployeeApplicationService } from '../services/employee-application.service';
import { OrganizationsService } from '../../organizations/services/organizations.service';
import { OrganizationLinkingService } from '../../organizations/services/organization-linking.service';

@Controller('employee-applications')
@UseGuards(JwtAuthGuard)
export class EmployeeApplicationController {
  private readonly logger = new Logger(EmployeeApplicationController.name);

  constructor(
    private readonly employeeApplicationService: EmployeeApplicationService,
    private readonly organizationsService: OrganizationsService,
    private readonly organizationLinkingService: OrganizationLinkingService,
    private readonly usersService: UsersService
  ) {}

  @Get()
  async getApplication(
    @Req() req: any,
    @Res() res: Response,
    @Query('carerId') carerId?: string
  ) {
    try {
      const currentUser = req.user;
      let userId = currentUser._id.toString();
      const org = req.currentOrganization;

      if (org && carerId) {
        const application =
          await this.employeeApplicationService.getApplicationFull(carerId);
        return res.status(HttpStatus.OK).json({
          success: true,
          message: 'Success',
          data: {
            ...application,
            organization: {
              _id: org._id.toString(),
              name: org.name,
              address: org.address,
              logoUrl: org.logoUrl,
              email: org.email,
              phone: org.phone,
            },
          },
        });
      }

      // If the user is care staff, return the full application
      if (req.staffType === 'care') {
        const application =
          await this.employeeApplicationService.getApplicationFull(userId);
        return res.status(HttpStatus.OK).json({
          success: true,
          message: 'Success',
          data: application,
        });
      }

      // Otherwise, return the application in the context of the current organization
      const application = await this.employeeApplicationService.getApplication(
        userId,
        req.currentOrganization._id.toString()
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Success',
        data: application,
      });
    } catch (error: any) {
      this.logger.error(
        `Error getting application: ${error.message}`,
        error.stack
      );
      return res.status(error.status || HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to get application',
      });
    }
  }

  @Get('agency-application')
  @UseGuards(OrganizationContextGuard)
  async getAgencyApplication(
    @Query() query: GetAgencyApplicationDto,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const org = req.currentOrganization;
      const { carerId, agencyOrgId } = query;

      // Check if agency is linked with this organization
      const linkedOrgs =
        await this.organizationLinkingService.getLinkedOrganizations(
          org._id.toString()
        );

      if (!linkedOrgs.find((o: any) => o._id.toString() === agencyOrgId)) {
        throw new BadRequestException(
          'Agency is not linked with this organization'
        );
      }

      const application = await this.employeeApplicationService.getApplication(
        carerId,
        agencyOrgId
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Success',
        data: application,
      });
    } catch (error: any) {
      this.logger.error(
        `Error getting agency application: ${error.message}`,
        error.stack
      );
      return res.status(error.status || HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to get agency application',
      });
    }
  }

  @Post()
  async createOrUpdateApplication(
    @Body() applicationData: any,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const currentUser = req.user;

      if (currentUser.role !== 'carer') {
        throw new BadRequestException('Only carer can create application');
      }

      const updatedApplication =
        await this.employeeApplicationService.createOrUpdateApplication(
          currentUser._id.toString(),
          applicationData
        );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Application updated successfully',
        data: updatedApplication,
      });
    } catch (error: any) {
      this.logger.error(
        `Error creating/updating application: ${error.message}`,
        error.stack
      );
      return res.status(error.status || HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to create/update application',
      });
    }
  }

  @Patch(':section/:index')
  async updateSection(
    @Param('section') section: string,
    @Body() updateSectionDto: UpdateSectionDto,
    @Req() req: any,
    @Res() res: Response,
    @Param('index') index?: string,
    @Query('carerId') carerId?: string
  ) {
    try {
      let employeeId = req.user._id.toString();
      let indexNumber: number | undefined;

      // Handle admin updates
      if (req.user.role === 'admin') {
        if (!carerId) {
          throw new BadRequestException(
            'Carer ID is required for admin updates'
          );
        }

        // Check if admin can update this application
        const canUpdate =
          await this.employeeApplicationService.canAdminUpdateApplication(
            req.currentOrganization?._id.toString(),
            carerId
          );

        if (!canUpdate) {
          throw new ForbiddenException(
            'You are not allowed to update this application'
          );
        }

        employeeId = carerId;
      }

      // Parse index if provided
      if (index !== undefined) {
        const parsedIndex = Number(index);
        if (
          !isNaN(parsedIndex) &&
          Number.isInteger(parsedIndex) &&
          parsedIndex >= 0
        ) {
          indexNumber = parsedIndex;
        }
      }

      const updatedApplication =
        await this.employeeApplicationService.updateSection(
          employeeId,
          section,
          updateSectionDto.data,
          indexNumber
        );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Section updated successfully',
        data: updatedApplication,
      });
    } catch (error: any) {
      this.logger.error(
        `Error updating section: ${error.message}`,
        error.stack
      );
      return res.status(error.status || HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to update section',
      });
    }
  }

  @Post(':arrayField')
  async addToArray(
    @Param('arrayField') arrayField: string,
    @Body() addToArrayDto: AddToArrayDto,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const currentUser = req.user;

      const updatedApplication =
        await this.employeeApplicationService.addToArray(
          currentUser._id.toString(),
          arrayField,
          addToArrayDto.item
        );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Item added successfully',
        data: updatedApplication,
      });
    } catch (error: any) {
      this.logger.error(`Error adding to array: ${error.message}`, error.stack);
      return res.status(error.status || HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to add item to array',
      });
    }
  }

  @Delete(':arrayField/:index')
  async removeFromArray(
    @Param('arrayField') arrayField: string,
    @Param('index', ParseIntPipe) index: number,
    @Req() req: any,
    @Res() res: Response,
    @Query('carerId') carerId?: string
  ) {
    try {
      let employeeId = req.user._id.toString();

      // Handle admin updates
      if (req.user.role === 'admin') {
        if (!carerId) {
          throw new BadRequestException(
            'Carer ID is required for admin updates'
          );
        }

        // Check if admin can update this application
        const canUpdate =
          await this.employeeApplicationService.canAdminUpdateApplication(
            req.currentOrganization?._id.toString(),
            carerId
          );

        if (!canUpdate) {
          throw new ForbiddenException(
            'You are not allowed to update this application'
          );
        }

        employeeId = carerId;
      }

      const updatedApplication =
        await this.employeeApplicationService.removeFromArray(
          employeeId,
          arrayField,
          index
        );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: `Item removed from ${arrayField} successfully`,
        data: updatedApplication,
      });
    } catch (error: any) {
      this.logger.error(
        `Error removing from array: ${error.message}`,
        error.stack
      );
      return res.status(error.status || HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to remove item from array',
      });
    }
  }

  @Delete('document/:section/:index')
  async deleteDocument(
    @Param('section') section: string,
    @Req() req: any,
    @Res() res: Response,
    @Param('index') index?: string,
    @Query('side') side?: 'front' | 'back',
    @Query('carerId') carerId?: string
  ) {
    try {
      let employeeId = req.user._id.toString();
      let indexNumber: number | undefined;

      // Handle admin updates
      if (req.user.role === 'admin') {
        if (!carerId) {
          throw new BadRequestException(
            'Carer ID is required for admin updates'
          );
        }

        // Check if admin can update this application
        const canUpdate =
          await this.employeeApplicationService.canAdminUpdateApplication(
            req.currentOrganization?._id.toString(),
            carerId
          );

        if (!canUpdate) {
          throw new ForbiddenException(
            'You are not allowed to update this application'
          );
        }

        employeeId = carerId;
      }

      // Parse index if provided
      if (index !== undefined) {
        const parsedIndex = Number(index);
        if (!isNaN(parsedIndex)) {
          indexNumber = parsedIndex;
        }
      }

      const updatedApplication =
        await this.employeeApplicationService.deleteDocument(
          employeeId,
          section,
          indexNumber,
          side
        );

      this.logger.log(
        `User ${employeeId} deleted document ${side || ''} from ${section}${
          indexNumber !== undefined ? ` at index ${indexNumber}` : ''
        }`
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Document deleted successfully',
        data: updatedApplication,
      });
    } catch (error: any) {
      this.logger.error(
        `Error deleting document: ${error.message}`,
        error.stack
      );
      return res.status(error.status || HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to delete document',
      });
    }
  }

  @Post('upload-document')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: any,
    @Body() uploadDocumentDto: UploadDocumentDto,
    @Req() req: any,
    @Res() res: Response,
    @Query('carerId') carerId?: string
  ) {
    try {
      let employeeId = req.user._id.toString();

      // Handle admin uploads
      if (req.user.role === 'admin') {
        if (!carerId) {
          throw new BadRequestException(
            'Carer ID is required for admin uploads'
          );
        }

        // Check if admin can update this application
        const canUpdate =
          await this.employeeApplicationService.canAdminUpdateApplication(
            req.currentOrganization?._id.toString(),
            carerId
          );

        if (!canUpdate) {
          throw new ForbiddenException(
            'You are not allowed to update this application'
          );
        }

        employeeId = carerId;
      }

      if (!file) {
        throw new BadRequestException('No file found');
      }

      if (!uploadDocumentDto.section) {
        throw new BadRequestException('Section is required');
      }

      const updatedApplication =
        await this.employeeApplicationService.uploadDocument(
          employeeId,
          file,
          uploadDocumentDto.section,
          uploadDocumentDto.documentType,
          uploadDocumentDto.index,
          uploadDocumentDto.side
        );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Document uploaded successfully',
        data: updatedApplication,
      });
    } catch (error: any) {
      this.logger.error(
        `Error uploading document: ${error.message}`,
        error.stack
      );
      return res.status(error.status || HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to upload document',
      });
    }
  }

  @Post('upload-documents')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadDocuments(
    @UploadedFiles() files: any,
    @Body() formData: any,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const currentUser = req.user;

      if (!files || files.length === 0) {
        throw new BadRequestException('No files found');
      }

      const filesMap: Record<string, any> = {};
      for (const file of files) {
        filesMap[file.fieldname] = file;
      }

      const updatedApplication =
        await this.employeeApplicationService.uploadDocuments(
          currentUser._id.toString(),
          filesMap,
          formData
        );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Documents uploaded successfully',
        data: updatedApplication,
      });
    } catch (error: any) {
      this.logger.error(
        `Error uploading documents: ${error.message}`,
        error.stack
      );
      return res.status(error.status || HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to upload documents',
      });
    }
  }

  @Post('submit')
  async submitApplication(@Req() req: any, @Res() res: Response) {
    try {
      const currentUser = req.user;

      const submittedApplication =
        await this.employeeApplicationService.submitApplication(
          currentUser._id.toString()
        );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Application submitted successfully',
        data: submittedApplication,
      });
    } catch (error: any) {
      this.logger.error(
        `Error submitting application: ${error.message}`,
        error.stack
      );
      return res.status(error.status || HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to submit application',
      });
    }
  }

  @Get('status')
  async getApplicationStatus(
    @Req() req: any,
    @Res() res: Response,
    @Query('userId') userId?: string
  ) {
    try {
      let employeeId = req.user._id.toString();

      // For admin users, allow fetching status for a specific user
      if (req.user.role === 'admin' && userId) {
        employeeId = userId;
      }

      const status = await this.employeeApplicationService.getApplicationStatus(
        employeeId
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Success',
        data: status,
      });
    } catch (error: any) {
      this.logger.error(
        `Error getting application status: ${error.message}`,
        error.stack
      );
      return res.status(error.status || HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to get application status',
      });
    }
  }
}

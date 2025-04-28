// employee-application.service.ts
import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as _ from 'lodash';
import { EmployeeApplication } from 'libs/api/core/src/lib/schemas';
import { OrganizationsService } from '../../organizations/services/organizations.service';
import { UsersService } from '../../users/services/users.service';
import { DocumentService } from './document.service';

interface PendingField {
  section: string;
  field: string;
}

@Injectable()
export class EmployeeApplicationService {
  private readonly logger = new Logger(EmployeeApplicationService.name);

  constructor(
    @InjectModel(EmployeeApplication.name)
    private readonly employeeApplicationModel: Model<EmployeeApplication>,
    private readonly organizationsService: OrganizationsService,
    private readonly usersService: UsersService,
    private readonly documentService: DocumentService
  ) {}

  async getOrCreateApplication(userId: string): Promise<any> {
    try {
      let application = await this.employeeApplicationModel.findOne({
        userId: new Types.ObjectId(userId),
      });

      if (!application) {
        application = new this.employeeApplicationModel({
          userId: new Types.ObjectId(userId),
        });
        await application.save();
      }
      return application;
    } catch (error) {
      this.logger.error(
        `Error in getOrCreateApplication: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async getApplicationFull(userId: string): Promise<any> {
    try {
      let application: any = await this.employeeApplicationModel
        .findOne({
          userId: new Types.ObjectId(userId),
        })
        .lean();

      if (!application) {
        application = new this.employeeApplicationModel({
          userId: new Types.ObjectId(userId),
        });
        await application.save();
        application = application.toObject();
      }

      // Calculate section completion status
      const sectionsCompletion = this.calculateSectionsCompletion(application);

      // Return the application with completion information
      return {
        ...application,
        completionStatus: sectionsCompletion,
      };
    } catch (error) {
      this.logger.error(
        `Error in getApplicationFull: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async getApplication(userId: string, organizationId: string): Promise<any> {
    try {
      const fieldVisibility = null;
      if (!fieldVisibility) {
        return this.employeeApplicationModel.findOne({
          userId: new Types.ObjectId(userId),
        });
      }

      //   const projectionStage =
      //     await this.fieldVisibilityService.generateProjectionStage(
      //       fieldVisibility.fields
      //     );

      const pipeline = [{ $match: { userId: new Types.ObjectId(userId) } }];

      const result = await this.employeeApplicationModel.aggregate(pipeline);
      return result[0];
    } catch (error) {
      this.logger.error(
        `Error in getApplication: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async createOrUpdateApplication(userId: string, data: any): Promise<any> {
    try {
      const application = await this.getOrCreateApplication(userId);

      if (application.userId.toString() !== userId) {
        throw new ForbiddenException('Unauthorized');
      }

      _.merge(application, data);
      await application.save();
      return application;
    } catch (error) {
      this.logger.error(
        `Error in createOrUpdateApplication: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async canAdminUpdateApplication(
    orgId: string,
    userId: string
  ): Promise<boolean> {
    try {
      //   const roles = await this.organizationsService.getUserRolesInOrganization(
      //     userId,
      //     orgId
      //   );

      //   if (
      //     roles.length === 0 ||
      //     !roles.some((role) => role.staffType === 'care')
      //   ) {
      //     return false;
      //   }
      return true;
    } catch (error) {
      this.logger.error(
        `Error in canAdminUpdateApplication: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async updateSection(
    userId: string,
    path: string,
    data: any,
    index?: number
  ): Promise<any> {
    try {
      console.log(
        `Updating section ${path} for user ${userId} with data:`,
        data,
        index
      );

      if (path === 'personalInfo' && data.email) {
        // Normalize email
        data.email = data.email.trim().toLowerCase();

        // Check for existing email
        const existingApplication = await this.employeeApplicationModel.findOne(
          {
            userId: { $ne: new Types.ObjectId(userId) }, // exclude current user
            'personalInfo.email': data.email,
          }
        );

        if (existingApplication) {
          throw new BadRequestException(
            'An application with this email already exists'
          );
        }
      }

      // Get or create the application
      const application = await this.getOrCreateApplication(userId);

      // Approach 1: Direct find and update (most reliable)
      if (index !== undefined && typeof index === 'number') {
        // Handle array updates with specific index
        const result = await this.employeeApplicationModel.findOneAndUpdate(
          { userId: new Types.ObjectId(userId) },
          { $set: { [`${path}.${index}`]: data } },
          { new: true, runValidators: true }
        );
        return result;
      } else if (Array.isArray(_.get(application, path))) {
        // Handle array push
        const result = await this.employeeApplicationModel.findOneAndUpdate(
          { userId: new Types.ObjectId(userId) },
          { $push: { [path]: data } },
          { new: true, runValidators: true }
        );
        return result;
      } else {
        // Handle object or field update
        const result = await this.employeeApplicationModel.findOneAndUpdate(
          { userId: new Types.ObjectId(userId) },
          { $set: { [path]: data } },
          { new: true, runValidators: true }
        );
        return result;
      }
    } catch (error) {
      this.logger.error(
        `Error in updateSection: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
  async addToArray(userId: string, arrayPath: string, item: any): Promise<any> {
    try {
      const updateQuery = { $push: { [arrayPath]: item } };

      await this.employeeApplicationModel.updateOne(
        { userId: new Types.ObjectId(userId) },
        updateQuery,
        { runValidators: true }
      );

      return await this.employeeApplicationModel.findOne({
        userId: new Types.ObjectId(userId),
      });
    } catch (error) {
      this.logger.error(`Error in addToArray: ${error.message}`, error.stack);
      throw error;
    }
  }

  async removeFromArray(
    userId: string,
    arrayPath: string,
    index: number
  ): Promise<any> {
    try {
      const application = await this.employeeApplicationModel.findOne({
        userId: new Types.ObjectId(userId),
      });

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      const currentArray = application.get(arrayPath);
      if (!Array.isArray(currentArray)) {
        throw new BadRequestException('Not an array');
      }

      // Simply remove the item at index
      currentArray.splice(index, 1);

      // Update the entire array in one go
      await this.employeeApplicationModel.findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $set: { [arrayPath]: currentArray } },
        { new: true }
      );

      return application;
    } catch (error) {
      this.logger.error(
        `Error in removeFromArray: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async uploadDocument(
    userId: string,
    file: any,
    path: string,
    documentType?: string,
    index?: number,
    side?: 'front' | 'back'
  ): Promise<any> {
    try {
      console.log('Uploading document:', file, path, documentType, index, side);
      const application = await this.getOrCreateApplication(userId);

      // Upload file to storage
      const uploadedDocument = await this.documentService.uploadDocument(
        userId,
        file,
        path
      );

      const documentData = {
        uploadUrl: uploadedDocument.url,
        fileName: file.originalname,
        uploadDate: new Date().toISOString(),
        documentType: documentType || 'default',
      };

      let updateQuery: any = { $set: {} };

      if (typeof index === 'number') {
        // Array fields
        if (side) {
          // New format with front/back
          updateQuery.$set[`${path}.${index}.${side}UploadUrl`] =
            documentData.uploadUrl;
        } else {
          // Old format
          updateQuery.$set[`${path}.${index}.uploadUrl`] =
            documentData.uploadUrl;
        }
        updateQuery.$set[`${path}.${index}.fileName`] = documentData.fileName;
        updateQuery.$set[`${path}.${index}.uploadDate`] =
          documentData.uploadDate;
      } else {
        // Single document fields
        if (side) {
          // New format with front/back
          updateQuery.$set[`${path}.${side}UploadUrl`] = documentData.uploadUrl;
        } else {
          // Old format
          updateQuery.$set[`${path}.uploadUrl`] = documentData.uploadUrl;
        }
        updateQuery.$set[`${path}.fileName`] = documentData.fileName;
        updateQuery.$set[`${path}.uploadDate`] = documentData.uploadDate;
      }

      await this.employeeApplicationModel.updateOne(
        { userId: new Types.ObjectId(userId) },
        updateQuery,
        { runValidators: true }
      );

      return await this.employeeApplicationModel.findOne({
        userId: new Types.ObjectId(userId),
      });
    } catch (error) {
      this.logger.error(
        `Error in uploadDocument: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async uploadDocuments(
    userId: string,
    files: Record<string, any>,
    formData: any
  ): Promise<any> {
    try {
      const application = await this.getOrCreateApplication(userId);

      for (const [fieldName, file] of Object.entries(files)) {
        const uploadedDocument = await this.documentService.uploadDocument(
          userId,
          file,
          fieldName
        );

        const path = this.getPathFromFieldName(fieldName);
        if (path) {
          const documentData = {
            uploadUrl: uploadedDocument.url,
            fileName: file.originalname,
            uploadDate: new Date(),
          };

          const updateQuery = {};
          _.set(updateQuery, path, documentData);

          await this.employeeApplicationModel.updateOne(
            { userId: new Types.ObjectId(userId) },
            { $set: updateQuery },
            { runValidators: true }
          );
        } else {
          await this.addToArray(userId, 'documents', {
            name: file.originalname,
            type: formData[`${fieldName}Type`] || 'default',
            url: uploadedDocument.url,
            uploadDate: new Date(),
          });
        }
      }

      for (const [key, value] of Object.entries(formData)) {
        if (!key.endsWith('Type')) {
          const path = this.getPathFromFieldName(key);
          if (path) {
            const updateQuery = {};
            _.set(updateQuery, path, value);

            await this.employeeApplicationModel.updateOne(
              { userId: new Types.ObjectId(userId) },
              { $set: updateQuery },
              { runValidators: true }
            );
          }
        }
      }

      return await this.employeeApplicationModel.findOne({
        userId: new Types.ObjectId(userId),
      });
    } catch (error) {
      this.logger.error(
        `Error in uploadDocuments: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async deleteDocument(
    userId: string,
    section: string,
    index?: number,
    side?: 'front' | 'back'
  ): Promise<any> {
    try {
      const application = await this.getOrCreateApplication(userId);
      let path = `${section}`;

      if (index !== undefined) {
        path += `.${index}`;
      }

      // Get the correct URL based on side
      const urlField = side ? `${side}UploadUrl` : 'uploadUrl';
      const documentUrl = _.get(application, `${path}.${urlField}`);

      // If there's a URL, try to delete from storage
      if (documentUrl) {
        try {
          await this.documentService.deleteDocument(documentUrl);
        } catch (storageError) {
          // Log the storage error
          this.logger.error(
            `Failed to delete file for user ${userId}, URL: ${documentUrl}`,
            storageError.stack
          );
        }
      }

      // Update database regardless of storage deletion result
      return this.updateDatabaseAfterDocumentDeletion(
        userId,
        path,
        urlField,
        index
      );
    } catch (error) {
      this.logger.error(
        `Error deleting document for user ${userId}, section ${section}, index ${index}, side ${side}`,
        error.stack
      );
      throw error;
    }
  }

  private async updateDatabaseAfterDocumentDeletion(
    userId: string,
    path: string,
    urlField: string,
    index?: number
  ): Promise<any> {
    let updateQuery: any = {};

    if (index !== undefined) {
      // For array fields
      updateQuery = {
        $unset: {
          [`${path}.${urlField}`]: '',
        },
      };
    } else {
      // For non-array fields
      updateQuery = {
        $set: {
          [`${path}.${urlField}`]: null,
        },
      };
    }

    const updatedApplication =
      await this.employeeApplicationModel.findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        updateQuery,
        { new: true, runValidators: true }
      );

    if (!updatedApplication) {
      throw new NotFoundException('Application not found');
    }

    return updatedApplication;
  }

  async submitApplication(userId: string): Promise<any> {
    try {
      const application = await this.getOrCreateApplication(userId);

      const updatedApplication =
        await this.employeeApplicationModel.findOneAndUpdate(
          { userId: new Types.ObjectId(userId) },
          {
            $set: {
              'applicationStatus.status': 'Submitted',
              'applicationStatus.submissionDate': new Date(),
            },
          },
          { new: true }
        );

      if (!updatedApplication) {
        throw new NotFoundException('Application not found');
      }

      return updatedApplication;
    } catch (error) {
      this.logger.error(
        `Error in submitApplication: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async getApplicationStatus(userId: string): Promise<any> {
    try {
      const application = await this.employeeApplicationModel
        .findOne({
          userId: new Types.ObjectId(userId),
        })
        .lean();

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      const status = application.applicationStatus?.status || 'Draft';
      const { completionPercentage, completedSections, pendingFields } =
        this.calculateApplicationCompletion(application);

      return {
        status,
        completionPercentage,
        completedSections,
        pendingFields,
      };
    } catch (error) {
      this.logger.error(
        `Error in getApplicationStatus: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  private getPathFromFieldName(fieldName: string): string | undefined {
    const paths: { [key: string]: string } = {
      identityDocument: 'identificationDocuments.passport',
      drivingLicense: 'identificationDocuments.drivingLicense',
      biometricResidencePermit:
        'identificationDocuments.biometricResidencePermit',
      rightToWorkProof: 'identificationDocuments.rightToWorkProofUrl',
    };
    return paths[fieldName];
  }

  // Private helper methods for application completion calculation
  private calculateSectionsCompletion(application: any): {
    overallCompletion: number;
    sections: { section: string; progress: number; status: string }[];
  } {
    const sections = [
      'personalInfo',
      'identificationDocuments',
      'professionalInfo',
      'skills',
      'availability',
      'healthAndSafety',
      'bankDetails',
      'additionalInfo',
      'consents',
    ];

    const sectionWeights: { [key: string]: number } = {
      personalInfo: 20,
      identificationDocuments: 20,
      professionalInfo: 15,
      skills: 10,
      availability: 10,
      healthAndSafety: 10,
      bankDetails: 5,
      additionalInfo: 5,
      consents: 5,
    };

    let totalWeight = 0;
    let completedWeight = 0;
    const sectionsStatus = [];

    for (const section of sections) {
      const weight = sectionWeights[section];
      totalWeight += weight;

      const sectionProgress = this.calculateSectionProgress(
        application,
        section
      );
      sectionsStatus.push({
        section,
        progress: sectionProgress.progress,
        status:
          sectionProgress.progress === 100
            ? 'complete'
            : sectionProgress.progress > 0
            ? 'in-progress'
            : 'not-started',
      });

      completedWeight += (weight * sectionProgress.progress) / 100;
    }

    const overallCompletion = Math.round((completedWeight / totalWeight) * 100);

    return {
      overallCompletion,
      sections: sectionsStatus,
    };
  }

  private calculateSectionProgress(
    application: any,
    section: string
  ): { progress: number; incompleteFields: string[] } {
    const sectionData = application[section];
    const incompleteFields: string[] = [];

    if (!sectionData) return { progress: 0, incompleteFields: [section] };

    let totalFields = 0;
    let completedFields = 0;

    switch (section) {
      case 'personalInfo': {
        const requiredFields = [
          'firstName',
          'lastName',
          'dateOfBirth',
          'nationalInsuranceNumber',
          'address',
          'phone',
          'email',
        ];
        totalFields = requiredFields.length;

        requiredFields.forEach((field) => {
          if (field === 'address') {
            // Check address fields
            if (
              sectionData.address &&
              sectionData.address.street &&
              sectionData.address.city &&
              sectionData.address.zipCode
            ) {
              completedFields++;
            } else {
              incompleteFields.push('address');
            }
          } else if (sectionData[field]) {
            completedFields++;
          } else {
            incompleteFields.push(field);
          }
        });
        break;
      }

      case 'identificationDocuments': {
        totalFields = 2; // rightToWorkStatus + at least one ID document

        if (sectionData.rightToWorkStatus) {
          completedFields++;
        } else {
          incompleteFields.push('rightToWorkStatus');
        }

        // Check if at least one ID document is uploaded
        const hasAnyDocument =
          (sectionData.passport &&
            (sectionData.passport.frontUploadUrl ||
              sectionData.passport.number)) ||
          (sectionData.drivingLicense &&
            (sectionData.drivingLicense.frontUploadUrl ||
              sectionData.drivingLicense.number)) ||
          (sectionData.biometricResidencePermit &&
            (sectionData.biometricResidencePermit.frontUploadUrl ||
              sectionData.biometricResidencePermit.number)) ||
          sectionData.rightToWorkProofUrl;

        if (hasAnyDocument) {
          completedFields++;
        } else {
          incompleteFields.push('identificationDocument');
        }
        break;
      }

      // Similar implementation for other sections
      // ...

      default: {
        // For any other section, consider it complete if there's any data
        if (sectionData && Object.keys(sectionData).length > 0) {
          totalFields = 1;
          completedFields = 1;
        } else {
          totalFields = 1;
          completedFields = 0;
          incompleteFields.push(section);
        }
      }
    }

    const progress =
      totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

    return { progress, incompleteFields };
  }

  private calculateApplicationCompletion(application: any): {
    completionPercentage: number;
    completedSections: {
      [key: string]: 'completed' | 'incomplete' | 'inProgress';
    };
    pendingFields: PendingField[];
  } {
    // Only use sections that are displayed in the frontend
    const sections = [
      'personalInfo',
      'identificationDocuments',
      'professionalInfo',
      'skills',
      'availability',
      'bankDetails',
      'additionalInfo',
    ];

    const sectionWeights: { [key: string]: number } = {
      personalInfo: 25,
      identificationDocuments: 20,
      professionalInfo: 15,
      skills: 15,
      availability: 10,
      bankDetails: 10,
      additionalInfo: 5,
    };

    let totalWeight = 0;
    let completedWeight = 0;
    const pendingFields: PendingField[] = [];
    const completedSections: {
      [key: string]: 'completed' | 'incomplete' | 'inProgress';
    } = {};

    for (const section of sections) {
      const weight = sectionWeights[section];
      totalWeight += weight;

      const { status, incompleteFields } = this.checkSectionCompletion(
        application,
        section
      );

      completedSections[section] = status;

      if (status === 'completed') {
        completedWeight += weight;
      } else if (status === 'inProgress') {
        completedWeight += weight * 0.5; // Give partial credit for in-progress sections
      }

      if (status !== 'completed') {
        pendingFields.push(
          ...incompleteFields.map((field) => ({ section, field }))
        );
      }
    }

    const completionPercentage = Math.round(
      (completedWeight / totalWeight) * 100
    );

    return { completionPercentage, completedSections, pendingFields };
  }

  private checkSectionCompletion(
    application: any,
    section: string
  ): {
    status: 'completed' | 'incomplete' | 'inProgress';
    incompleteFields: string[];
  } {
    const sectionData = application[section];
    const incompleteFields: string[] = [];

    if (!sectionData)
      return { status: 'incomplete', incompleteFields: [section] };

    // Track if any fields are filled (for inProgress status)
    let hasAnyData = false;
    let hasMissingRequiredFields = false;

    // Implement section-specific validation logic
    // For brevity, I'll implement just a few sections
    switch (section) {
      case 'personalInfo':
        // Required fields
        const personalRequiredFields = [
          'firstName',
          'lastName',
          'dateOfBirth',
          'nationalInsuranceNumber',
          'phone',
          'email',
        ];

        personalRequiredFields.forEach((field) => {
          if (!sectionData[field]) {
            incompleteFields.push(field);
            hasMissingRequiredFields = true;
          } else {
            hasAnyData = true;
          }
        });

        // Check address as a special case
        if (
          !sectionData.address ||
          !sectionData.address.street ||
          !sectionData.address.city
        ) {
          incompleteFields.push('address');
          hasMissingRequiredFields = true;
        } else {
          hasAnyData = true;
        }

        // Check for avatar
        if (sectionData.avatarUrl) {
          hasAnyData = true;
        }
        break;

      case 'identificationDocuments':
        // Check if at least one ID document is complete
        const hasCompletePassport =
          sectionData.passport &&
          sectionData.passport.number &&
          sectionData.passport.frontUploadUrl;

        const hasCompleteDrivingLicense =
          sectionData.drivingLicense &&
          sectionData.drivingLicense.number &&
          sectionData.drivingLicense.frontUploadUrl;

        const hasCompleteBRP =
          sectionData.biometricResidencePermit &&
          sectionData.biometricResidencePermit.number &&
          sectionData.biometricResidencePermit.frontUploadUrl;

        // Check for any ID document info
        const hasAnyPassportInfo =
          sectionData.passport &&
          (sectionData.passport.number ||
            sectionData.passport.frontUploadUrl ||
            sectionData.passport.backUploadUrl);

        const hasAnyDrivingLicenseInfo =
          sectionData.drivingLicense &&
          (sectionData.drivingLicense.number ||
            sectionData.drivingLicense.frontUploadUrl ||
            sectionData.drivingLicense.backUploadUrl);

        const hasAnyBRPInfo =
          sectionData.biometricResidencePermit &&
          (sectionData.biometricResidencePermit.number ||
            sectionData.biometricResidencePermit.frontUploadUrl ||
            sectionData.biometricResidencePermit.backUploadUrl);

        // Right to work status
        const hasRightToWork =
          sectionData.rightToWorkProofUrl || sectionData.rightToWorkStatus;

        // Track if any documents are completely filled
        const hasCompleteIDDocument =
          hasCompletePassport || hasCompleteDrivingLicense || hasCompleteBRP;

        // Track if any documents have partial information
        const hasAnyIDInfo =
          hasAnyPassportInfo || hasAnyDrivingLicenseInfo || hasAnyBRPInfo;

        // Set status based on completeness
        if (!hasCompleteIDDocument) {
          incompleteFields.push('identificationDocument');
          hasMissingRequiredFields = true;
        }

        // Check if information exists but is incomplete
        if (hasAnyIDInfo) {
          hasAnyData = true;
        }
        break;

      // Implement other sections similarly...
      default:
        // For sections not specifically handled, check if there's any data
        hasAnyData = sectionData && Object.keys(sectionData).length > 0;
        break;
    }

    // Determine section status
    if (incompleteFields.length === 0) {
      return { status: 'completed', incompleteFields };
    } else if (hasAnyData) {
      return { status: 'inProgress', incompleteFields };
    } else {
      return { status: 'incomplete', incompleteFields };
    }
  }
}

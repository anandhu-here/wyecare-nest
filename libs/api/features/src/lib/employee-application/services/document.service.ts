import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FirebaseService } from '../../firebase/services/firebase.service';
import { EmployeeApplication } from 'libs/api/core/src/lib/schemas';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);
  private bucket: string;
  private readonly isEmulator: boolean;

  constructor(
    @InjectModel(EmployeeApplication.name)
    private readonly carerApplicationModel: Model<EmployeeApplication>,
    private readonly configService: ConfigService,
    private readonly firebaseService: FirebaseService
  ) {
    this.bucket = this.configService.get<string>('BUCKET') as string;

    // Check if we're in emulator mode
    const environment =
      this.configService.get<string>('NODE_ENV') || 'development';
    this.isEmulator =
      (environment === 'development' || environment === 'local') &&
      !!process.env['FIREBASE_STORAGE_EMULATOR_HOST'];

    this.logger.log(
      `DocumentService initialized with emulator mode: ${this.isEmulator}`
    );
  }

  async uploadDocument(
    userId: string,
    file: any,
    section: string
  ): Promise<{ url: string; name: string }> {
    if (!file) {
      throw new BadRequestException('No file was uploaded');
    }

    try {
      // Create an organized folder structure
      const fileName = `${userId}/${section}/${Date.now()}_${
        file.originalname
      }`;

      const url = await this.uploadFile(file, fileName);

      const document = {
        name: file.originalname,
        url,
      };

      return document;
    } catch (error) {
      this.logger.error(
        `Error uploading document: ${error.message}`,
        error.stack
      );
      throw new BadRequestException(
        `Failed to upload document: ${error.message}`
      );
    }
  }

  async deleteDocument(url: string): Promise<void> {
    if (!url) {
      throw new BadRequestException('File URL is required');
    }

    try {
      // Extract file path from URL
      let filePath: string;

      const decodeUrl = decodeURIComponent(url);

      if (this.isEmulator) {
        // For emulator URLs, extract the file path differently
        const regex = /\/v0\/b\/[^/]+\/o\/([^?]+)/;
        const match = decodeUrl.match(regex);

        if (!match || !match[1]) {
          throw new BadRequestException(
            'Could not extract file path from emulator URL'
          );
        }

        filePath = decodeURIComponent(match[1]);
      } else if (decodeUrl.includes('firebasestorage.app')) {
        // Standard Firebase Storage URL
        const regex = /firebasestorage\.app\/(.*?)(\?|$)/;
        const match = decodeUrl.match(regex);

        if (!match || !match[1]) {
          throw new BadRequestException('Could not extract file path from URL');
        }

        filePath = match[1];
      } else if (decodeUrl.includes('googleapis.com')) {
        // Alternative Google Storage URL format
        const regex = /\/([^/]+?\.[^/]+?)(\?|$)/;
        const match = decodeUrl.match(regex);

        if (!match || !match[1]) {
          throw new BadRequestException('Could not extract file path from URL');
        }

        filePath = match[1];
      } else {
        throw new BadRequestException('Unsupported storage URL format');
      }

      await this.deleteFile(filePath);
    } catch (error) {
      this.logger.error(
        `Error deleting document: ${error.message}`,
        error.stack
      );
      throw new BadRequestException(
        `Failed to delete document: ${error.message}`
      );
    }
  }

  // Helper methods for file operations
  private async uploadFile(file: any, fileName: string): Promise<string> {
    try {
      const bucket = this.firebaseService.getDefaultBucket();
      const fileBuffer = file.buffer;

      const fileUpload = bucket.file(fileName);
      await fileUpload.save(fileBuffer, {
        metadata: {
          contentType: file.mimetype,
        },
      });

      // Use different URL generation approach based on environment
      if (this.isEmulator) {
        // For emulator, construct a local URL
        const emulatorHost =
          process.env['FIREBASE_STORAGE_EMULATOR_HOST'] || 'localhost:9199';
        const projectId =
          this.configService.get<string>('FIREBASE_PROJECT_ID') || 'demo-local';
        const bucketName =
          this.configService.get<string>('FIREBASE_STORAGE_BUCKET') ||
          'demo-local.appspot.com';

        // Format: http://[emulator-host]/v0/b/[bucket]/o/[fileName]
        const url = `http://${emulatorHost}/v0/b/${bucketName}/o/${encodeURIComponent(
          fileName
        )}?alt=media`;
        this.logger.debug(`Generated emulator URL: ${url}`);
        return url;
      } else {
        // For production, use signed URL
        const [signedUrl] = await fileUpload.getSignedUrl({
          action: 'read',
          expires: '03-01-2500', // Far future date
        });
        return signedUrl;
      }
    } catch (error) {
      this.logger.error(`Error in uploadFile: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  private async deleteFile(fileName: string): Promise<void> {
    try {
      const bucket = this.firebaseService.getDefaultBucket();
      const file = bucket.file(fileName);

      // Check if file exists before attempting to delete
      const [exists] = await file.exists();
      if (!exists) {
        throw new NotFoundException('File does not exist in storage');
      }

      await file.delete();
    } catch (error) {
      this.logger.error(`Error in deleteFile: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }

  // Document management methods for employee applications
  async addDocumentToApplication(
    userId: string,
    section: string,
    documentData: { url: string; fileName: string; uploadDate: Date }
  ): Promise<void> {
    try {
      await this.carerApplicationModel.findOneAndUpdate(
        { userId: userId },
        {
          $set: {
            [`${section}.documentUrl`]: documentData.url,
            [`${section}.fileName`]: documentData.fileName,
            [`${section}.uploadDate`]: documentData.uploadDate,
          },
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      this.logger.error(
        `Error in addDocumentToApplication: ${error.message}`,
        error.stack
      );
      throw new BadRequestException(
        `Failed to update application with document: ${error.message}`
      );
    }
  }

  async updateShareCode(userId: string, shareCode: string): Promise<void> {
    try {
      const result = await this.carerApplicationModel.findOneAndUpdate(
        { userId: userId },
        { $set: { 'identificationDocuments.rightToWorkStatus': shareCode } },
        { new: true }
      );

      if (!result) {
        throw new NotFoundException('Employee application not found');
      }
    } catch (error) {
      this.logger.error(
        `Error in updateShareCode: ${error.message}`,
        error.stack
      );
      throw new BadRequestException(
        `Failed to update share code: ${error.message}`
      );
    }
  }

  async updateNiNumber(userId: string, niNumber: string): Promise<void> {
    try {
      const result = await this.carerApplicationModel.findOneAndUpdate(
        { userId: userId },
        { $set: { 'personalInfo.nationalInsuranceNumber': niNumber } },
        { new: true }
      );

      if (!result) {
        throw new NotFoundException('Employee application not found');
      }
    } catch (error) {
      this.logger.error(
        `Error in updateNiNumber: ${error.message}`,
        error.stack
      );
      throw new BadRequestException(
        `Failed to update NI number: ${error.message}`
      );
    }
  }

  async getEmployeeDocuments(userId: string): Promise<any> {
    try {
      return await this.carerApplicationModel
        .findOne({ userId: userId })
        .lean();
    } catch (error) {
      this.logger.error(
        `Error in getEmployeeDocuments: ${error.message}`,
        error.stack
      );
      throw new BadRequestException(
        `Failed to get employee documents: ${error.message}`
      );
    }
  }
}

import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Organization, User } from 'libs/api/core/src/lib/schemas';
import { FirebaseService } from '../../firebase/services/firebase.service';

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Injectable()
export class PictureService {
  private bucket: string;
  private readonly isEmulator: boolean;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<Organization>,
    private readonly configService: ConfigService,
    private readonly firebaseService: FirebaseService
  ) {
    this.bucket = this.configService.get<string>('BUCKET') as any;

    // Check if we're in emulator mode
    const environment =
      this.configService.get<string>('NODE_ENV') || 'development';
    this.isEmulator =
      (environment === 'development' || environment === 'local') &&
      !!process.env['FIREBASE_STORAGE_EMULATOR_HOST'];

    console.log(
      `PictureService initialized with emulator mode: ${this.isEmulator}`
    );
  }

  private async deleteFile(fileName: string): Promise<void> {
    try {
      const bucket = this.firebaseService.getDefaultBucket();
      const file = bucket.file(fileName);
      await file.delete();
    } catch (error) {
      console.error('Error in deleteFile:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  private async uploadFile(
    file: UploadedFile,
    fileName: string
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file was uploaded');
    }

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
        console.log(`Generated emulator URL: ${url}`);
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
      console.error('Error in uploadFile:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  // Rest of the service methods remain the same...

  public async uploadTaskPhoto(
    taskData: any,
    file: UploadedFile
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file was uploaded');
    }

    try {
      // Extract relevant information from task data
      const { residentId, taskId, taskType, careHomeId } = taskData;

      // Create an organized folder structure for task photos
      const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const fileName = `task_photos/${taskType}/${residentId}/${dateStr}/${taskId}_${Date.now()}_${
        file.originalname
      }`;

      const url = await this.uploadFile(file, fileName);
      return url;
    } catch (error) {
      console.error('Error in uploadTaskPhoto:', error);
      throw new Error(`Failed to upload task photo: ${error.message}`);
    }
  }

  public async uploadOrgLogo(
    orgId: string,
    file: UploadedFile
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file was uploaded');
    }

    try {
      const fileName = `org_logos/${orgId}_${file.originalname}`;
      const url = await this.uploadFile(file, fileName);

      // Update org's logo
      const org = await this.organizationModel.findByIdAndUpdate(orgId, {
        logoUrl: url,
      });

      if (!org) {
        throw new NotFoundException('Organization not found');
      }

      return url;
    } catch (error) {
      console.error('Error in uploadOrgLogo:', error);
      throw new Error(`Failed to upload org logo: ${error.message}`);
    }
  }

  public async uploadProfilePictureForCarers(
    userId: string,
    file: UploadedFile
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file was uploaded');
    }

    try {
      const fileName = `profile_pictures/${userId}_${file.originalname}`;
      const url = await this.uploadFile(file, fileName);

      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      return url;
    } catch (error) {
      console.error('Error in uploadProfilePictureForCarers:', error);
      throw new Error(
        `Failed to upload profile picture for carers: ${error.message}`
      );
    }
  }

  public async uploadProfilePicture(
    userId: string,
    file: UploadedFile,
    userType?: string
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file was uploaded');
    }

    try {
      const fileName = `profile_pictures/${userId}_${file.originalname}`;
      const url = await this.uploadFile(file, fileName);

      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Update user's avatar
      user.avatarUrl = url;
      await user.save();

      return url;
    } catch (error) {
      console.error('Error in uploadProfilePicture:', error);
      throw new Error(`Failed to upload profile picture: ${error.message}`);
    }
  }

  public async deleteProfilePicture(userId: string): Promise<User> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.avatarUrl) {
        // Extract file name from the URL
        const urlParts = user.avatarUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];

        // Delete the file from storage
        await this.deleteFile(`profile_pictures/${fileName}`);
      }

      // Remove avatar from user
      user.avatarUrl = undefined;
      await user.save();

      return user;
    } catch (error) {
      console.error('Error in deleteProfilePicture:', error);
      throw new Error(`Failed to delete profile picture: ${error.message}`);
    }
  }

  public async getProfilePictureUrl(userId: string): Promise<string | null> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user.avatarUrl || null;
    } catch (error) {
      console.error('Error in getProfilePictureUrl:', error);
      throw new Error(`Failed to get profile picture URL: ${error.message}`);
    }
  }
}

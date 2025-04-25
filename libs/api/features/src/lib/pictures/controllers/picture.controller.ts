import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../authentication/jwt/jwt-auth.guard';
import { PictureService } from '../services/picture.service';

// Define the file interface in the controller as well for clarity
interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@ApiTags('Pictures')
@Controller('pictures')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PictureController {
  constructor(private readonly pictureService: PictureService) {}

  @Post('organization/:orgId/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an organization logo' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  async uploadOrgLogo(
    @Param('orgId') orgId: string,
    @UploadedFile() file: UploadedFile
  ) {
    if (!file) {
      throw new BadRequestException('No files were uploaded.');
    }

    try {
      const logoUrl = await this.pictureService.uploadOrgLogo(orgId, file);
      return {
        success: true,
        data: {
          logoUrl,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Internal server error');
    }
  }

  @Post('carer-profile-picture/:userId/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a carer profile picture' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async uploadCarerProfilePicture(
    @Param('userId') userId: string,
    @UploadedFile() file: UploadedFile
  ) {
    if (!file) {
      throw new BadRequestException('No files were uploaded.');
    }

    try {
      const avatarUrl = await this.pictureService.uploadProfilePictureForCarers(
        userId,
        file
      );
      return {
        success: true,
        data: {
          avatarUrl,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Internal server error');
    }
  }

  @Post(':userId/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a profile picture' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async uploadProfilePicture(
    @Param('userId') userId: string,
    @UploadedFile() file: UploadedFile,
    @Req() req: any
  ) {
    if (!file) {
      throw new BadRequestException('No files were uploaded.');
    }

    try {
      // Use the authenticated user's ID from JWT if no userId is provided
      const targetUserId = userId || req.user._id;

      // Get staff type from request if available
      const staffType = req.staffType;

      const avatarUrl = await this.pictureService.uploadProfilePicture(
        targetUserId,
        file,
        staffType
      );

      return {
        success: true,
        data: {
          avatarUrl,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Internal server error');
    }
  }

  /* 
  @Post('resident/:residentId/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a resident profile picture' })
  @ApiParam({ name: 'residentId', description: 'Resident ID' })
  async uploadResidentProfilePicture(
    @Param('residentId') residentId: string,
    @UploadedFile() file: UploadedFile
  ) {
    if (!file) {
      throw new BadRequestException('No files were uploaded.');
    }

    try {
      const avatarUrl = await this.pictureService.uploadResidentProfilePicture(
        residentId,
        file
      );
      
      return {
        success: true,
        data: {
          avatarUrl
        }
      };
    } catch (error) {
      throw new InternalServerErrorException('Internal server error');
    }
  }
  */

  @Delete(':userId/delete')
  @ApiOperation({ summary: 'Delete a profile picture' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async deleteProfilePicture(@Req() req: any) {
    try {
      const userId = req.user._id;
      await this.pictureService.deleteProfilePicture(userId);

      return {
        success: true,
        message: 'Profile picture deleted successfully',
      };
    } catch (error) {
      throw new InternalServerErrorException('Internal server error');
    }
  }

  @Get(':userId/url')
  @ApiOperation({ summary: 'Get a profile picture URL' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async getProfilePictureUrl(@Param('userId') userId: string, @Req() req: any) {
    try {
      // Use the authenticated user's ID if no userId is provided
      const targetUserId = userId || req.user._id;
      const url = await this.pictureService.getProfilePictureUrl(targetUserId);

      return {
        success: true,
        data: { url },
      };
    } catch (error) {
      throw new InternalServerErrorException('Internal server error');
    }
  }
}

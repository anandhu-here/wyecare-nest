// Improved organizations.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { OrganizationsService } from '../services/organizations.service';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../casl/guards/policies.guard';
import { CheckPolicies } from '../../casl/decorators/check-policies.decorator';
import { Action } from '../../casl/enums/actions.enums';
import { CreateDepartmentDto } from '../dto/create-department.dto';
import { OrgCategory } from '@prisma/client';
import { Department, Organization } from '../../casl/entities';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.CREATE, Organization))
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({
    status: 201,
    description: 'The organization has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(createOrganizationDto);
  }

  @Get()
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.READ, Organization))
  @ApiOperation({ summary: 'Get all organizations' })
  @ApiResponse({ status: 200, description: 'Return all organizations.' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, enum: OrgCategory })
  findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('name') name?: string,
    @Query('category') category?: OrgCategory
  ) {
    const where: any = {
      ...(name && { name: { contains: name, mode: 'insensitive' } }),
      ...(category && { category }),
    };

    return this.organizationsService.findAll({
      skip: skip ? +skip : 0,
      take: take ? +take : 10,
      where,
      orderBy: { name: 'asc' },
    });
  }

  @Get(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.READ, Organization))
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiResponse({ status: 200, description: 'Return the organization.' })
  @ApiResponse({ status: 404, description: 'Organization not found.' })
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.UPDATE, Organization))
  @ApiOperation({ summary: 'Update organization by ID' })
  @ApiResponse({
    status: 200,
    description: 'The organization has been successfully updated.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Organization not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto
  ) {
    return this.organizationsService.update(id, updateOrganizationDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.DELETE, Organization))
  @ApiOperation({ summary: 'Delete organization by ID' })
  @ApiResponse({
    status: 204,
    description: 'The organization has been successfully deleted.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Organization not found.' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Cannot delete organization with dependencies.',
  })
  remove(@Param('id') id: string) {
    return this.organizationsService.remove(id);
  }

  // Department endpoints
  @Post(':id/departments')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.CREATE, Department))
  @ApiOperation({ summary: 'Create a new department in organization' })
  @ApiResponse({
    status: 201,
    description: 'The department has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Organization not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  createDepartment(
    @Param('id') id: string,
    @Body() createDepartmentDto: CreateDepartmentDto
  ) {
    return this.organizationsService.createDepartment(id, createDepartmentDto);
  }

  @Get(':id/departments')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.READ, Department))
  @ApiOperation({ summary: 'Get all departments in organization' })
  @ApiResponse({ status: 200, description: 'Return all departments.' })
  @ApiResponse({ status: 404, description: 'Organization not found.' })
  getDepartments(@Param('id') id: string) {
    return this.organizationsService.getDepartments(id);
  }
}

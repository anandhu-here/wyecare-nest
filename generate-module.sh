#!/bin/bash
# Check if module name is provided
if [ -z "$1" ]; then
  echo "Usage: ./generate-module.sh [module-name]"
  exit 1
fi

# Set module name from argument
MODULE_NAME=$1

# Base path where the module will be created
BASE_PATH="apps/api/src/app/$MODULE_NAME"

# Create main directory structure
mkdir -p "$BASE_PATH/controllers"
mkdir -p "$BASE_PATH/dto"
mkdir -p "$BASE_PATH/services"

# Create controller file
cat > "$BASE_PATH/controllers/$MODULE_NAME.controller.ts" << EOF
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ${MODULE_NAME^}Service } from '../services/${MODULE_NAME}.service';
import { Create${MODULE_NAME^}Dto } from '../dto/create-${MODULE_NAME}.dto';
import { Update${MODULE_NAME^}Dto } from '../dto/update-${MODULE_NAME}.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../casl/guards/policies.guard';
import { CheckPolicies } from '../../casl/decorators/check-policies.decorator';
import { Action } from '../../casl/enums/actions.enums';

@Controller('${MODULE_NAME}')
@UseGuards(JwtAuthGuard)
export class ${MODULE_NAME^}Controller {
  constructor(private readonly ${MODULE_NAME}Service: ${MODULE_NAME^}Service) {}

  @Post()
  @UseGuards(PoliciesGuard)
  @CheckPolicies({ action: Action.Create, subject: '${MODULE_NAME^}' })
  create(@Body() create${MODULE_NAME^}Dto: Create${MODULE_NAME^}Dto) {
    return this.${MODULE_NAME}Service.create(create${MODULE_NAME^}Dto);
  }

  @Get()
  @UseGuards(PoliciesGuard)
  @CheckPolicies({ action: Action.Read, subject: '${MODULE_NAME^}' })
  findAll(@Query() query: any) {
    return this.${MODULE_NAME}Service.findAll(query);
  }

  @Get(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies({ action: Action.Read, subject: '${MODULE_NAME^}' })
  findOne(@Param('id') id: string) {
    return this.${MODULE_NAME}Service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies({ action: Action.Update, subject: '${MODULE_NAME^}' })
  update(@Param('id') id: string, @Body() update${MODULE_NAME^}Dto: Update${MODULE_NAME^}Dto) {
    return this.${MODULE_NAME}Service.update(id, update${MODULE_NAME^}Dto);
  }

  @Delete(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies({ action: Action.Delete, subject: '${MODULE_NAME^}' })
  remove(@Param('id') id: string) {
    return this.${MODULE_NAME}Service.remove(id);
  }
}
EOF

# Create service file
cat > "$BASE_PATH/services/$MODULE_NAME.service.ts" << EOF
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Create${MODULE_NAME^}Dto } from '../dto/create-${MODULE_NAME}.dto';
import { Update${MODULE_NAME^}Dto } from '../dto/update-${MODULE_NAME}.dto';

@Injectable()
export class ${MODULE_NAME^}Service {
  constructor(private prisma: PrismaService) {}

  create(create${MODULE_NAME^}Dto: Create${MODULE_NAME^}Dto) {
    return this.prisma.${MODULE_NAME}.create({
      data: create${MODULE_NAME^}Dto,
    });
  }

  findAll(query: any) {
    const { skip, take, ...filters } = query;
    
    return this.prisma.${MODULE_NAME}.findMany({
      where: filters,
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
    });
  }

  async findOne(id: string) {
    const ${MODULE_NAME} = await this.prisma.${MODULE_NAME}.findUnique({
      where: { id },
    });

    if (!${MODULE_NAME}) {
      throw new NotFoundException(\`${MODULE_NAME^} with ID \${id} not found\`);
    }

    return ${MODULE_NAME};
  }

  async update(id: string, update${MODULE_NAME^}Dto: Update${MODULE_NAME^}Dto) {
    await this.findOne(id);
    
    return this.prisma.${MODULE_NAME}.update({
      where: { id },
      data: update${MODULE_NAME^}Dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    
    return this.prisma.${MODULE_NAME}.delete({
      where: { id },
    });
  }
}
EOF

# Create module file
cat > "$BASE_PATH/${MODULE_NAME}.module.ts" << EOF
import { Module } from '@nestjs/common';
import { ${MODULE_NAME^}Controller } from './controllers/${MODULE_NAME}.controller';
import { ${MODULE_NAME^}Service } from './services/${MODULE_NAME}.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CaslModule } from '../casl/casl.module';

@Module({
  imports: [PrismaModule, CaslModule],
  controllers: [${MODULE_NAME^}Controller],
  providers: [${MODULE_NAME^}Service],
  exports: [${MODULE_NAME^}Service],
})
export class ${MODULE_NAME^}Module {}
EOF

# Create basic DTOs
cat > "$BASE_PATH/dto/create-${MODULE_NAME}.dto.ts" << EOF
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean, IsDate, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class Create${MODULE_NAME^}Dto {
  // Define properties here based on your Prisma model
  // Example properties (customize based on your model)
  @IsNotEmpty()
  @IsString()
  name: string;
  
  @IsOptional()
  @IsString()
  description?: string;
  
  @IsNotEmpty()
  @IsUUID()
  organizationId: string;
}
EOF

cat > "$BASE_PATH/dto/update-${MODULE_NAME}.dto.ts" << EOF
import { PartialType } from '@nestjs/mapped-types';
import { Create${MODULE_NAME^}Dto } from './create-${MODULE_NAME}.dto';

export class Update${MODULE_NAME^}Dto extends PartialType(Create${MODULE_NAME^}Dto) {}
EOF

echo "Module structure for '$MODULE_NAME' created successfully at $BASE_PATH"
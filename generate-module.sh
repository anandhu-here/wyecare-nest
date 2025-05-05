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
import { Controller } from '@nestjs/common';
import { ${MODULE_NAME^}Service } from '../services/${MODULE_NAME}.service';

@Controller('${MODULE_NAME}')
export class ${MODULE_NAME^}Controller {
  constructor(private readonly ${MODULE_NAME}Service: ${MODULE_NAME^}Service) {}
}
EOF

# Create service file
cat > "$BASE_PATH/services/$MODULE_NAME.service.ts" << EOF
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ${MODULE_NAME^}Service {
  constructor(private prisma: PrismaService) {}
}
EOF

# Create module file
cat > "$BASE_PATH/${MODULE_NAME}.module.ts" << EOF
import { Module } from '@nestjs/common';
import { ${MODULE_NAME^}Controller } from './controllers/${MODULE_NAME}.controller';
import { ${MODULE_NAME^}Service } from './services/${MODULE_NAME}.service';

@Module({
  controllers: [${MODULE_NAME^}Controller],
  providers: [${MODULE_NAME^}Service],
  exports: [${MODULE_NAME^}Service],
})
export class ${MODULE_NAME^}Module {}
EOF

# Create basic DTOs
cat > "$BASE_PATH/dto/create-${MODULE_NAME}.dto.ts" << EOF
export class Create${MODULE_NAME^}Dto {
  // Define properties here
}
EOF

cat > "$BASE_PATH/dto/update-${MODULE_NAME}.dto.ts" << EOF
import { PartialType } from '@nestjs/mapped-types';
import { Create${MODULE_NAME^}Dto } from './create-${MODULE_NAME}.dto';

export class Update${MODULE_NAME^}Dto extends PartialType(Create${MODULE_NAME^}Dto) {}
EOF

echo "Module structure for '$MODULE_NAME' created successfully at $BASE_PATH"

# Make the script executable

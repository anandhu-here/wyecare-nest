import { Module } from '@nestjs/common';
import { CoreModule } from '@wyecare-monorepo/api/core';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { AuthorizationModule } from '../authorization/authorization.module';
@Module({
  imports: [CoreModule, AuthorizationModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

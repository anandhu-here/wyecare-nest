// apps/api/src/app/casl/guards/policies.guard.ts

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AbilityFactory } from '../../casl/abilities/ability.factory';
import { CHECK_POLICIES_KEY } from '../../casl/decorators/check-policies.decorator';
import { PolicyHandler } from '../../casl/interfaces/policy-handler.interface';

@Injectable()
export class PoliciesGuard implements CanActivate {
  private readonly logger = new Logger(PoliciesGuard.name);

  constructor(
    private reflector: Reflector,
    private abilityFactory: AbilityFactory
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const controller = context.getClass();
    const controllerName = controller.name;
    const handlerName = handler.name;

    this.logger.log(
      `Checking policies for ${controllerName}.${handlerName} - ${request.method} ${request.url}`
    );

    const policyHandlers =
      this.reflector.get<PolicyHandler[]>(CHECK_POLICIES_KEY, handler) || [];

    if (policyHandlers.length === 0) {
      this.logger.log(
        `No policy handlers found for ${controllerName}.${handlerName} - Allowing request`
      );
      return true; // No policies to check
    }

    this.logger.log(
      `Found ${policyHandlers.length} policy handlers for ${controllerName}.${handlerName}`
    );

    const { user } = request;
    if (!user) {
      this.logger.warn(
        `No authenticated user found for ${controllerName}.${handlerName} - Denying request`
      );
      return false; // No authenticated user
    }

    this.logger.log(
      `User authenticated: ${user.id} (${user.email}) - Creating ability`
    );

    try {
      const ability = await this.abilityFactory.createForUser(user.id);

      // Log the rule count to confirm ability was created
      this.logger.log(
        `Ability created with ${ability.rules?.length || 0} rules`
      );

      let allPassed = true;
      for (const handler of policyHandlers) {
        const handlerResult = this.execPolicyHandler(handler, ability);

        if (typeof handler === 'function') {
          this.logger.log(`Policy handler function result: ${handlerResult}`);
        } else {
          this.logger.log(`Policy handler object result: ${handlerResult}`);
        }

        // If any handler fails, we can stop checking
        if (!handlerResult) {
          allPassed = false;
          this.logger.warn(
            `Policy check failed for ${controllerName}.${handlerName}`
          );
          break;
        }
      }

      if (allPassed) {
        this.logger.log(
          `All policy checks passed for ${controllerName}.${handlerName} - Allowing request`
        );
      } else {
        this.logger.warn(
          `Policy checks failed for ${controllerName}.${handlerName} - Denying request`
        );
      }

      return allPassed;
    } catch (error) {
      this.logger.error(
        `Error checking policies for ${controllerName}.${handlerName}: ${error.message}`,
        error.stack
      );
      return false; // Deny on error
    }
  }

  private execPolicyHandler(handler: PolicyHandler, ability: any): boolean {
    try {
      if (typeof handler === 'function') {
        return handler(ability);
      }
      return handler.handle(ability);
    } catch (error) {
      this.logger.error(
        `Error executing policy handler: ${error.message}`,
        error.stack
      );
      return false; // Deny on error
    }
  }
}

// apps/api/src/app/casl/guards/policies.guard.ts

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AbilityFactory,
  AppAbility,
} from '../../casl/abilities/ability.factory';
import { PolicyHandler } from '../../casl/interfaces/policy-handler.interface';
import { CHECK_POLICIES_KEY } from '../../casl/decorators/check-policies.decorator';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: AbilityFactory
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyHandlers =
      this.reflector.get<PolicyHandler[]>(
        CHECK_POLICIES_KEY,
        context.getHandler()
      ) || [];

    // If no policy handlers, allow access (rely on other guards)
    if (policyHandlers.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // If no user, deny access
    if (!user) {
      return false;
    }

    // Create ability for the user
    const ability = await this.caslAbilityFactory.createForUser(user.id, {
      request: context.switchToHttp().getRequest(),
    });

    // Check if the user meets all policy requirements
    return policyHandlers.every((handler) =>
      this.execPolicyHandler(handler, ability)
    );
  }

  private execPolicyHandler(handler: PolicyHandler, ability: AppAbility) {
    if (typeof handler === 'function') {
      return handler(ability);
    }

    return handler.handle(ability);
  }
}

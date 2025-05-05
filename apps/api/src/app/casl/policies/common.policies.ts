// apps/api/src/app/casl/policies/common-policies.ts

import { AppAbility } from '../abilities/ability.factory';
import { Action } from '../enums/actions.enums';
import { IPolicyHandler } from '../interfaces/policy-handler.interface';

export class ReadPolicyHandler implements IPolicyHandler {
  constructor(private resource: any) {}

  handle(ability: AppAbility): boolean {
    return ability.can(Action.READ, this.resource);
  }
}

export class CreatePolicyHandler implements IPolicyHandler {
  constructor(private resource: any) {}

  handle(ability: AppAbility): boolean {
    return ability.can(Action.CREATE, this.resource);
  }
}

export class UpdatePolicyHandler implements IPolicyHandler {
  constructor(private resource: any) {}

  handle(ability: AppAbility): boolean {
    return ability.can(Action.UPDATE, this.resource);
  }
}

export class DeletePolicyHandler implements IPolicyHandler {
  constructor(private resource: any) {}

  handle(ability: AppAbility): boolean {
    return ability.can(Action.DELETE, this.resource);
  }
}

export class ManagePolicyHandler implements IPolicyHandler {
  constructor(private resource: any) {}

  handle(ability: AppAbility): boolean {
    return ability.can(Action.MANAGE, this.resource);
  }
}

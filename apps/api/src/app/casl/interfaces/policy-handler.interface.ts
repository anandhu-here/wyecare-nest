// apps/api/src/app/casl/interfaces/policy-handler.interface.ts

import { AppAbility } from '../abilities/ability.factory';

export interface IPolicyHandler {
  handle(ability: AppAbility): boolean;
}

export type PolicyHandlerCallback = (ability: AppAbility) => boolean;

export type PolicyHandler = IPolicyHandler | PolicyHandlerCallback;

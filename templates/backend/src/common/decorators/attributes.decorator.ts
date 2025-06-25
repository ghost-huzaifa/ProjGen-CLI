import { SetMetadata } from '@nestjs/common';

export interface AttributeCondition {
  attributeName: string;
  values: string[];
}

export const ATTRIBUTES_KEY = 'attributes';
export const RequireAttributes = (...conditions: AttributeCondition[]) =>
  SetMetadata(ATTRIBUTES_KEY, conditions);

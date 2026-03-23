import type { EventType, FlowId, RuleId } from '../../core/types/brand';

export interface ExpectedRule {
  readonly kind: 'expected';
  readonly id: RuleId;
  readonly eventType: EventType;
}

export interface ForbiddenRule {
  readonly kind: 'forbidden';
  readonly id: RuleId;
  readonly eventType: EventType;
}

export interface OrderRule {
  readonly kind: 'order';
  readonly id: RuleId;
  readonly beforeEventType: EventType;
  readonly afterEventType: EventType;
}

export type Rule = ExpectedRule | ForbiddenRule | OrderRule;

export interface FlowDefinition {
  readonly flowId: FlowId;
  readonly version: number;
  readonly description?: string;
  readonly rules: Rule[];
}

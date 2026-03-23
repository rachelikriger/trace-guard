import type { EventId, RuleId } from '../../types/brand';
import type { Rule } from '../../../models/internal/flow';

export type RuleViolationCode =
  | 'expected_missing'
  | 'forbidden_present'
  | 'order_missing_before'
  | 'order_missing_after'
  | 'order_incorrect_sequence';

export interface RuleViolation {
  readonly ruleId: RuleId;
  readonly kind: Rule['kind'];
  readonly code: RuleViolationCode;
  readonly message: string;
  readonly evidenceEventIds: EventId[];
}

export interface RuleEvaluationStats {
  readonly matchedCount: number;
  readonly firstMatchedAt?: Date;
  readonly lastMatchedAt?: Date;
}

export interface RuleEvaluation {
  readonly ruleId: RuleId;
  readonly kind: Rule['kind'];
  readonly passed: boolean;
  readonly evidenceEventIds: EventId[];
  readonly violations: RuleViolation[];
  readonly stats: RuleEvaluationStats;
}

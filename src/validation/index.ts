/**
 * Validation-focused public entrypoint.
 */
export type { RuleEvaluation, RuleEvaluationStats, RuleViolation, RuleViolationCode } from '../core/validation/models/ruleEvaluation';
export type { EventScope, ValidationReport, ValidationStatus } from '../core/validation/models/validationReport';
export { filterEventsByScope, matchesEventScope } from '../core/validation/models/validationReport';
export type { ValidationRunIteration, ValidationRunResult, ValidationRunStatus } from '../core/runner/models/validationRunResult';

export { validateFlow } from '../core/validation/validateFlow';
export { runValidation } from '../core/runner/validationRunner';

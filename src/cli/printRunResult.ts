import type { ValidationRunResult } from "../core/runner/models/validationRunResult";
import type { RuleViolation } from "../core/validation/models/ruleEvaluation";

const mapDisplayStatus = (result: ValidationRunResult): "PASS" | "FAIL" | "TIMEOUT" => {
  if (result.status === "timeout") {
    return "TIMEOUT";
  }

  if (result.finalReport.status === "pass") {
    return "PASS";
  }

  return "FAIL";
};

const formatViolation = (violation: RuleViolation): string =>
  `- [${violation.code}] rule=${violation.ruleId} kind=${violation.kind} message=${violation.message}`;

export const printRunResult = (result: ValidationRunResult): void => {
  const status = mapDisplayStatus(result);
  const report = result.finalReport;

  console.log(`Status: ${status}`);
  console.log(
    `Rules: total=${report.evaluatedRuleCount}, passed=${report.passedRuleCount}, failed=${report.failedRuleCount}`,
  );
  console.log(
    `Events: scoped=${report.scopedEvents}, totalCollected=${result.totalUniqueEvents}, totalFetched=${result.totalFetchedEvents}`,
  );

  if (report.violations.length === 0) {
    console.log("Violations: none");
    return;
  }

  console.log("Violations:");
  report.violations.forEach((violation: RuleViolation): void => {
    console.log(formatViolation(violation));
  });
};

export const printInputError = (message: string): void => {
  console.error(`Input error: ${message}`);
};

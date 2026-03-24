import type { ValidationReport } from '../../validation/models/validationReport';

export type ValidationRunStatus = 'pass' | 'timeout';

export interface ValidationRunIteration {
  readonly iteration: number;
  readonly fetchedEventCount: number;
  readonly uniqueAddedEventCount: number;
  readonly collectedEventCount: number;
  readonly validationStatus: ValidationReport['status'];
  readonly violationCount: number;
}

export interface ValidationRunResult {
  readonly status: ValidationRunStatus;
  readonly startedAt: Date;
  readonly endedAt: Date;
  readonly elapsedMs: number;
  readonly iterations: ValidationRunIteration[];
  readonly totalFetchedEvents: number;
  readonly totalUniqueEvents: number;
  readonly finalReport: ValidationReport;
}

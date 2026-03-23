import type { CorrelationId, RunId } from '../../core/types/brand';

export interface RunnerConfig {
  readonly runId?: RunId;
  readonly correlationId?: CorrelationId;
  readonly timeoutMs: number;
  readonly pollMs: number;
  readonly limit?: number;
  readonly since?: Date;
}

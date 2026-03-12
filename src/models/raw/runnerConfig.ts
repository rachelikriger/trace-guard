export interface RawRunnerConfig {
  readonly runId?: string;
  readonly correlationId?: string;
  readonly timeoutMs: string | number;
  readonly pollMs: string | number;
  readonly limit?: string | number;
  readonly since?: string;
}

export interface RawTraceEvent {
  readonly id: string;
  readonly eventType: string;
  readonly timestamp: string;
  readonly source: string;
  readonly payload: unknown;
  readonly runId?: string;
  readonly correlationId?: string;
}

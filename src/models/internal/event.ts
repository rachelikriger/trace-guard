import type { CorrelationId, EventId, EventType, RunId } from '../../core/types/brand';

export interface TraceEvent {
  readonly id: EventId;
  readonly eventType: EventType;
  readonly timestamp: Date;
  readonly source: string;
  readonly payload: unknown;
  readonly runId?: RunId;
  readonly correlationId?: CorrelationId;
}

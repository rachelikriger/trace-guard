import type {
  CorrelationId,
  EventId,
  EventType,
  RunId,
  SourceName,
} from "../types/brand";

export interface TraceEvent {
  readonly id: EventId;
  readonly eventType: EventType;
  readonly timestamp: Date;
  readonly source: SourceName;
  readonly payload: unknown;
  readonly runId?: RunId;
  readonly correlationId?: CorrelationId;
}

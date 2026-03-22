import type { TraceEvent } from "../models/internal/event";
import type { EventScope } from "../core/validation/models/validationReport";

export interface EventCursor {
  readonly timestamp: Date;
  readonly eventId: string;
}

export interface EventSourcePollRequest {
  readonly iteration: number;
  readonly eventScope?: EventScope;
  readonly since?: Date;
  readonly cursor?: EventCursor;
  readonly limit?: number;
  readonly now: Date;
}

export interface EventSourcePollResponse {
  readonly events: TraceEvent[];
}

export interface EventSource {
  poll(request: EventSourcePollRequest): Promise<EventSourcePollResponse>;
}

import type { TraceEvent } from "../../models/internal/event";
import { filterEventsByScope } from "../../core/validation/models/validationReport";
import type { EventSource, EventSourcePollRequest, EventSourcePollResponse } from "../eventSource";

const isAfterCursor = (event: TraceEvent, cursor: EventSourcePollRequest["cursor"]): boolean => {
  if (cursor === undefined) {
    return true;
  }

  const eventTime: number = event.timestamp.getTime();
  const cursorTime: number = cursor.timestamp.getTime();
  if (eventTime > cursorTime) {
    return true;
  }

  if (eventTime < cursorTime) {
    return false;
  }

  return event.id > cursor.eventId;
};

export class MockEventSource implements EventSource {
  private readonly batches: ReadonlyArray<ReadonlyArray<TraceEvent>>;

  public constructor(batches: ReadonlyArray<ReadonlyArray<TraceEvent>>) {
    this.batches = batches;
  }

  public async poll(request: EventSourcePollRequest): Promise<EventSourcePollResponse> {
    const rawBatch: ReadonlyArray<TraceEvent> =
      this.batches[request.iteration - 1] ?? [];

    let events: TraceEvent[] = filterEventsByScope([...rawBatch], request.eventScope);

    if (request.since !== undefined) {
      const sinceTime: number = request.since.getTime();
      events = events.filter((event: TraceEvent): boolean => event.timestamp.getTime() >= sinceTime);
    }

    events = events.filter((event: TraceEvent): boolean => isAfterCursor(event, request.cursor));

    if (request.limit !== undefined) {
      events = events.slice(0, request.limit);
    }

    return { events };
  }
}

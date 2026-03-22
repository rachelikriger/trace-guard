import type { TraceEvent } from "../../models/internal/event";
import { filterEventsByScope } from "../../core/validation/models/validationReport";
import type { EventSource, EventSourcePollRequest, EventSourcePollResponse } from "../eventSource";

const isAfterCursor = (event: TraceEvent, cursor: EventSourcePollRequest["cursor"]): boolean => {
  if (cursor === undefined) {
    return true;
  }

  const eventTime = event.timestamp.getTime();
  const cursorTime = cursor.timestamp.getTime();
  if (eventTime > cursorTime) {
    return true;
  }

  if (eventTime < cursorTime) {
    return false;
  }

  return event.id > cursor.eventId;
};

export class FileEventSource implements EventSource {
  private readonly events: ReadonlyArray<TraceEvent>;

  public constructor(events: ReadonlyArray<TraceEvent>) {
    this.events = events;
  }

  public async poll(request: EventSourcePollRequest): Promise<EventSourcePollResponse> {
    let filtered: TraceEvent[] = filterEventsByScope([...this.events], request.eventScope);

    if (request.since !== undefined) {
      const sinceTime = request.since.getTime();
      filtered = filtered.filter((event: TraceEvent): boolean => event.timestamp.getTime() >= sinceTime);
    }

    filtered = filtered.filter((event: TraceEvent): boolean => isAfterCursor(event, request.cursor));

    if (request.limit !== undefined) {
      filtered = filtered.slice(0, request.limit);
    }

    return { events: filtered };
  }
}

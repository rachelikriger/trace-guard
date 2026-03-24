import type { TraceEvent } from '../../models/internal/event';
import { filterEventsByScope } from '../../core/validation/models/validationReport';
import { compareTraceEventToCursor } from '../../core/events/compareTraceEvents';
import type { EventSource, EventSourcePollRequest, EventSourcePollResponse } from '../eventSource';

const isAfterCursor = (event: TraceEvent, cursor: EventSourcePollRequest['cursor']): boolean => {
  if (cursor === undefined) {
    return true;
  }

  return compareTraceEventToCursor(event, cursor.timestamp, cursor.eventId) > 0;
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

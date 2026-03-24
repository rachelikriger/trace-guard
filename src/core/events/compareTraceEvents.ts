import type { TraceEvent } from '../../models/internal/event';

export const compareTraceEvents = (a: TraceEvent, b: TraceEvent): number => {
  const timeDifference: number = a.timestamp.getTime() - b.timestamp.getTime();
  if (timeDifference !== 0) {
    return timeDifference;
  }

  if (a.id === b.id) {
    return 0;
  }

  return a.id > b.id ? 1 : -1;
};

export const compareTraceEventToCursor = (event: TraceEvent, cursorTimestamp: Date, cursorEventId: string): number => {
  const timeDifference: number = event.timestamp.getTime() - cursorTimestamp.getTime();
  if (timeDifference !== 0) {
    return timeDifference;
  }

  if (event.id === cursorEventId) {
    return 0;
  }

  return event.id > cursorEventId ? 1 : -1;
};

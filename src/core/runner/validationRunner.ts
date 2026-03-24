import type { TraceEvent } from '../../models/internal/event';
import type { FlowDefinition } from '../../models/internal/flow';
import type { RunnerConfig } from '../../models/internal/runnerConfig';
import type { EventSource, EventCursor } from '../../sources/eventSource';
import { validateFlow } from '../validation/validateFlow';
import type { EventScope } from '../validation/models/validationReport';
import type { ValidationRunIteration, ValidationRunResult } from './models/validationRunResult';

export interface ValidationRunnerOptions {
  readonly flow: FlowDefinition;
  readonly config: RunnerConfig;
  readonly source: EventSource;
  readonly eventScope?: EventScope;
}

interface RunnerDependencies {
  readonly now: () => Date;
  readonly sleep: (ms: number) => Promise<void>;
}

interface PollRequestOptions {
  readonly iteration: number;
  readonly now: Date;
  readonly eventScope?: EventScope;
  readonly since?: Date;
  readonly cursor?: EventCursor;
  readonly limit?: number;
}

interface PollRequestInput {
  readonly iteration: number;
  readonly now: Date;
  readonly eventScope: EventScope | undefined;
  readonly since: Date | undefined;
  readonly cursor: EventCursor | undefined;
  readonly limit: number | undefined;
}

const defaultDependencies: RunnerDependencies = {
  now: () => new Date(),
  sleep: (ms: number): Promise<void> =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    }),
};

const compareEventOrder = (a: TraceEvent, b: TraceEvent): number => {
  const timeDiff: number = a.timestamp.getTime() - b.timestamp.getTime();
  if (timeDiff !== 0) {
    return timeDiff;
  }

  if (a.id === b.id) {
    return 0;
  }

  return a.id > b.id ? 1 : -1;
};

const getCursorFromEvents = (events: TraceEvent[]): EventCursor | undefined => {
  if (events.length === 0) {
    return undefined;
  }

  const firstEvent: TraceEvent | undefined = events[0];
  if (firstEvent === undefined) {
    return undefined;
  }

  const maxEvent: TraceEvent = events.reduce(
    (currentMax: TraceEvent, event: TraceEvent): TraceEvent => (compareEventOrder(event, currentMax) > 0 ? event : currentMax),
    firstEvent,
  );

  return {
    timestamp: maxEvent.timestamp,
    eventId: maxEvent.id,
  };
};

const buildTimeoutResult = (
  startedAt: Date,
  endedAt: Date,
  iterations: ValidationRunIteration[],
  totalFetchedEvents: number,
  totalUniqueEvents: number,
  finalReport: ReturnType<typeof validateFlow>,
): ValidationRunResult => ({
  status: 'timeout',
  startedAt,
  endedAt,
  elapsedMs: endedAt.getTime() - startedAt.getTime(),
  iterations,
  totalFetchedEvents,
  totalUniqueEvents,
  finalReport,
});

const buildPassResult = (
  startedAt: Date,
  endedAt: Date,
  iterations: ValidationRunIteration[],
  totalFetchedEvents: number,
  totalUniqueEvents: number,
  finalReport: ReturnType<typeof validateFlow>,
): ValidationRunResult => ({
  status: 'pass',
  startedAt,
  endedAt,
  elapsedMs: endedAt.getTime() - startedAt.getTime(),
  iterations,
  totalFetchedEvents,
  totalUniqueEvents,
  finalReport,
});

const buildPollRequest = (input: PollRequestInput): PollRequestOptions => ({
  iteration: input.iteration,
  now: input.now,
  ...(input.eventScope !== undefined ? { eventScope: input.eventScope } : {}),
  ...(input.since !== undefined ? { since: input.since } : {}),
  ...(input.cursor !== undefined ? { cursor: input.cursor } : {}),
  ...(input.limit !== undefined ? { limit: input.limit } : {}),
});

export const runValidation = async (
  options: ValidationRunnerOptions,
  dependencies: RunnerDependencies = defaultDependencies,
): Promise<ValidationRunResult> => {
  const startedAt: Date = dependencies.now();
  const deadlineMs: number = startedAt.getTime() + options.config.timeoutMs;

  const collectedById: Map<string, TraceEvent> = new Map<string, TraceEvent>();
  const iterations: ValidationRunIteration[] = [];
  let cursor: EventCursor | undefined;
  let totalFetchedEvents = 0;
  let iterationNumber = 1;

  for (;;) {
    const pollRequest = buildPollRequest({
      iteration: iterationNumber,
      now: dependencies.now(),
      eventScope: options.eventScope,
      since: options.config.since,
      cursor,
      limit: options.config.limit,
    });

    const pollResponse = await options.source.poll(pollRequest);

    const fetchedEvents: TraceEvent[] = pollResponse.events;
    totalFetchedEvents += fetchedEvents.length;

    let uniqueAddedEventCount = 0;
    fetchedEvents.forEach((event: TraceEvent) => {
      const eventId: string = event.id;
      if (!collectedById.has(eventId)) {
        collectedById.set(eventId, event);
        uniqueAddedEventCount += 1;
      }
    });

    const cursorFromBatch: EventCursor | undefined = getCursorFromEvents(fetchedEvents);
    if (cursorFromBatch !== undefined) {
      cursor = cursorFromBatch;
    }

    const collectedEvents: TraceEvent[] = Array.from(collectedById.values());
    const report = validateFlow(options.flow, collectedEvents, options.eventScope);

    iterations.push({
      iteration: iterationNumber,
      fetchedEventCount: fetchedEvents.length,
      uniqueAddedEventCount,
      collectedEventCount: collectedEvents.length,
      validationStatus: report.status,
      violationCount: report.violations.length,
    });

    if (report.status === 'pass') {
      return buildPassResult(startedAt, dependencies.now(), iterations, totalFetchedEvents, collectedById.size, report);
    }

    const nowMs: number = dependencies.now().getTime();
    if (nowMs >= deadlineMs) {
      return buildTimeoutResult(startedAt, dependencies.now(), iterations, totalFetchedEvents, collectedById.size, report);
    }

    iterationNumber += 1;
    await dependencies.sleep(options.config.pollMs);
  }
};

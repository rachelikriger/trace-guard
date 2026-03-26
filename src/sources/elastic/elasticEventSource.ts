import { compareTraceEventToCursor } from '../../core/events/compareTraceEvents';
import type { TraceEvent } from '../../models/internal/event';
import { parseTraceEvent } from '../../parsing/events/parseTraceEvent';
import type { EventSource, EventSourcePollRequest, EventSourcePollResponse } from '../eventSource';
import type { ElasticClient, ElasticSearchRequest, ElasticSearchResponse } from './elasticClient';

export interface ElasticFieldConfig {
  readonly timestamp: string;
  readonly runId: string;
  readonly correlationId: string;
}

export interface ElasticEventSourceConfig {
  readonly index: string;
  readonly client: ElasticClient;
  readonly defaultLimit?: number;
  readonly fields?: Partial<ElasticFieldConfig>;
}

const defaultFields: ElasticFieldConfig = {
  timestamp: 'timestamp',
  runId: 'runId',
  correlationId: 'correlationId',
};

const defaultLimit = 500;

const isAfterCursor = (event: TraceEvent, cursor: EventSourcePollRequest['cursor']): boolean => {
  if (cursor === undefined) {
    return true;
  }

  return compareTraceEventToCursor(event, cursor.timestamp, cursor.eventId) > 0;
};

const toRawEventRecord = (value: unknown): Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Elastic hit source must be an object.');
  }

  return value as Record<string, unknown>;
};

const mapHitToTraceEvent = (source: unknown): TraceEvent => {
  const parseResult = parseTraceEvent(source);
  if (!parseResult.ok) {
    throw new Error(`Elastic hit could not be parsed into TraceEvent: ${JSON.stringify(parseResult.error)}`);
  }

  return parseResult.value;
};

const buildSearchRequest = (
  request: EventSourcePollRequest,
  config: ElasticEventSourceConfig,
  fields: ElasticFieldConfig,
): ElasticSearchRequest => {
  const filters: Record<string, unknown>[] = [];

  if (request.since !== undefined && request.cursor === undefined) {
    filters.push({
      range: {
        [fields.timestamp]: {
          gte: request.since.toISOString(),
        },
      },
    });
  }

  if (request.eventScope?.runId !== undefined) {
    filters.push({
      term: {
        [fields.runId]: request.eventScope.runId,
      },
    });
  }

  if (request.eventScope?.correlationId !== undefined) {
    filters.push({
      term: {
        [fields.correlationId]: request.eventScope.correlationId,
      },
    });
  }

  return {
    index: config.index,
    size: request.limit ?? config.defaultLimit ?? defaultLimit,
    sort: [{ [fields.timestamp]: 'asc' }, { id: 'asc' }],
    query: {
      bool: {
        filter: filters,
      },
    },
    ...(request.cursor !== undefined ? { searchAfter: [request.cursor.timestamp.toISOString(), request.cursor.eventId] } : {}),
  };
};

export class ElasticEventSource implements EventSource {
  private readonly config: ElasticEventSourceConfig;
  private readonly fields: ElasticFieldConfig;

  public constructor(config: ElasticEventSourceConfig) {
    this.config = config;
    this.fields = {
      ...defaultFields,
      ...(config.fields ?? {}),
    };
  }

  public async poll(request: EventSourcePollRequest): Promise<EventSourcePollResponse> {
    const searchRequest = buildSearchRequest(request, this.config, this.fields);
    const response: ElasticSearchResponse = await this.config.client.search(searchRequest);

    const events = response.hits.hits
      .map((hit) => toRawEventRecord(hit._source))
      .map((source) => mapHitToTraceEvent(source))
      .filter((event: TraceEvent): boolean => isAfterCursor(event, request.cursor));

    return { events };
  }
}

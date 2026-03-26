import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { EventSourcePollRequest } from '../../../sources/eventSource';
import type { ElasticClient, ElasticSearchRequest, ElasticSearchResponse } from '../../../sources/elastic/elasticClient';
import { ElasticEventSource } from '../../../sources/elastic/elasticEventSource';
import { parseTraceEvent } from '../../../parsing/events/parseTraceEvent';

class FakeElasticClient implements ElasticClient {
  public readonly calls: ElasticSearchRequest[] = [];
  private readonly responses: ElasticSearchResponse[];

  public constructor(responses: ElasticSearchResponse[]) {
    this.responses = responses;
  }

  public async search(request: ElasticSearchRequest): Promise<ElasticSearchResponse> {
    this.calls.push(request);
    return this.responses[this.calls.length - 1] ?? { hits: { hits: [] } };
  }
}

const baseRequest = (overrides: Partial<EventSourcePollRequest> = {}): EventSourcePollRequest => ({
  iteration: 1,
  now: new Date('2026-03-20T00:00:00.000Z'),
  ...overrides,
});

describe('ElasticEventSource', () => {
  it('maps Elastic hits into TraceEvent and applies scoped query filters', async () => {
    const parsedScopeEvent = parseTraceEvent({
      id: 'scope-event',
      eventType: 'SCOPE_EVENT',
      timestamp: '2026-03-19T00:00:00.000Z',
      source: 'test',
      payload: {},
      runId: 'run-1',
      correlationId: 'corr-1',
    });
    if (!parsedScopeEvent.ok || parsedScopeEvent.value.runId === undefined || parsedScopeEvent.value.correlationId === undefined) {
      throw new Error('Failed to build scope fixture event.');
    }

    const client = new FakeElasticClient([
      {
        hits: {
          hits: [
            {
              _id: 'doc-1',
              _source: {
                id: 'event-1',
                eventType: 'PAYMENT_STARTED',
                timestamp: '2026-03-19T00:00:00.000Z',
                source: 'elastic',
                payload: {},
                runId: 'run-1',
                correlationId: 'corr-1',
              },
            },
          ],
        },
      },
    ]);

    const source = new ElasticEventSource({ index: 'trace-events', client });
    const response = await source.poll(
      baseRequest({
        since: new Date('2026-03-18T00:00:00.000Z'),
        eventScope: {
          runId: parsedScopeEvent.value.runId,
          correlationId: parsedScopeEvent.value.correlationId,
        },
      }),
    );

    assert.equal(response.events.length, 1);
    assert.equal(response.events[0]?.id, 'event-1');
    assert.equal(client.calls.length, 1);

    const firstCall = client.calls[0];
    assert.notEqual(firstCall, undefined);
    if (firstCall === undefined) {
      throw new Error('Missing elastic call');
    }

    assert.equal(firstCall.index, 'trace-events');
    assert.equal(firstCall.size, 500);
    assert.deepEqual(firstCall.sort, [{ timestamp: 'asc' }, { id: 'asc' }]);
    assert.deepEqual(firstCall.searchAfter, undefined);
    assert.deepEqual(firstCall.query, {
      bool: {
        filter: [
          {
            range: {
              timestamp: {
                gte: '2026-03-18T00:00:00.000Z',
              },
            },
          },
          {
            term: {
              runId: 'run-1',
            },
          },
          {
            term: {
              correlationId: 'corr-1',
            },
          },
        ],
      },
    });
  });

  it('uses cursor as search_after and returns only events strictly after cursor', async () => {
    const client = new FakeElasticClient([
      {
        hits: {
          hits: [
            {
              _id: 'doc-1',
              _source: {
                id: 'event-1',
                eventType: 'PAYMENT_STARTED',
                timestamp: '2026-03-19T00:00:00.000Z',
                source: 'elastic',
                payload: {},
              },
            },
            {
              _id: 'doc-2',
              _source: {
                id: 'event-2',
                eventType: 'PAYMENT_COMPLETED',
                timestamp: '2026-03-19T00:00:00.000Z',
                source: 'elastic',
                payload: {},
              },
            },
          ],
        },
      },
    ]);

    const source = new ElasticEventSource({ index: 'trace-events', client, defaultLimit: 100 });
    const response = await source.poll(
      baseRequest({
        cursor: {
          timestamp: new Date('2026-03-19T00:00:00.000Z'),
          eventId: 'event-1',
        },
      }),
    );

    assert.equal(client.calls.length, 1);
    const call = client.calls[0];
    if (call === undefined) {
      throw new Error('Missing elastic call');
    }

    assert.deepEqual(call.searchAfter, ['2026-03-19T00:00:00.000Z', 'event-1']);
    assert.equal(call.size, 100);
    assert.equal(response.events.length, 1);
    assert.equal(response.events[0]?.id, 'event-2');
  });

  it('throws when elastic hit cannot be parsed into TraceEvent', async () => {
    const client = new FakeElasticClient([
      {
        hits: {
          hits: [
            {
              _id: 'doc-bad',
              _source: {
                id: 'event-1',
                eventType: 'PAYMENT_STARTED',
                source: 'elastic',
                payload: {},
              },
            },
          ],
        },
      },
    ]);
    const source = new ElasticEventSource({ index: 'trace-events', client });

    await assert.rejects(() => source.poll(baseRequest()), /could not be parsed/i);
  });
});

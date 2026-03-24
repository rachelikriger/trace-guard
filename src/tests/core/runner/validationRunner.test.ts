import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { runValidation } from '../../../core/runner/validationRunner';
import { MockEventSource } from '../../../sources/mock/mockEventSource';
import { createEvent, createFlow } from '../../helpers/factories';
import { parseRunnerConfigInput } from '../../../parsing/config/parseRunnerConfig';

const createDeterministicClock = () => {
  const baseMs: number = Date.parse('2026-03-12T00:00:00.000Z');
  let elapsedMs = 0;

  return {
    now: (): Date => new Date(baseMs + elapsedMs),
    sleep: async (ms: number): Promise<void> => {
      elapsedMs += ms;
    },
  };
};

describe('runValidation', () => {
  it('stops early on pass when rule set is satisfied', async () => {
    const flow = createFlow({
      flowId: 'flow-runner-pass',
      rules: [
        { kind: 'expected', id: 'rule-expected', eventType: 'PAYMENT_STARTED' },
        {
          kind: 'order',
          id: 'rule-order',
          beforeEventType: 'PAYMENT_STARTED',
          afterEventType: 'PAYMENT_COMPLETED',
        },
      ],
    });

    const source = new MockEventSource([
      [
        createEvent({
          id: 'event-1',
          eventType: 'PAYMENT_STARTED',
          timestamp: '2026-03-12T00:00:01.000Z',
        }),
      ],
      [
        createEvent({
          id: 'event-2',
          eventType: 'PAYMENT_COMPLETED',
          timestamp: '2026-03-12T00:00:02.000Z',
        }),
      ],
    ]);

    const configResult = parseRunnerConfigInput({
      timeoutMs: 100,
      pollMs: 10,
    });
    if (!configResult.ok) {
      throw new Error(`Invalid test config: ${JSON.stringify(configResult.error)}`);
    }

    const result = await runValidation({ flow, config: configResult.value, source }, createDeterministicClock());

    assert.equal(result.status, 'pass');
    assert.equal(result.finalReport.status, 'pass');
    assert.equal(result.iterations.length, 2);
    assert.equal(result.totalUniqueEvents, 2);
  });

  it('returns timeout when no passing state is reached', async () => {
    const flow = createFlow({
      flowId: 'flow-runner-timeout',
      rules: [{ kind: 'expected', id: 'rule-expected', eventType: 'PAYMENT_STARTED' }],
    });

    const source = new MockEventSource([[], [], []]);
    const configResult = parseRunnerConfigInput({
      timeoutMs: 25,
      pollMs: 10,
    });
    if (!configResult.ok) {
      throw new Error(`Invalid test config: ${JSON.stringify(configResult.error)}`);
    }

    const result = await runValidation({ flow, config: configResult.value, source }, createDeterministicClock());

    assert.equal(result.status, 'timeout');
    assert.equal(result.finalReport.status, 'fail');
    assert.equal(result.iterations.length >= 2, true);
  });

  it('deduplicates repeated events across polls by event id', async () => {
    const flow = createFlow({
      flowId: 'flow-runner-dedup',
      rules: [{ kind: 'expected', id: 'rule-expected', eventType: 'PAYMENT_COMPLETED' }],
    });

    const event1 = createEvent({
      id: 'event-1',
      eventType: 'PAYMENT_STARTED',
      timestamp: '2026-03-12T00:00:01.000Z',
    });
    const event2 = createEvent({
      id: 'event-2',
      eventType: 'PAYMENT_COMPLETED',
      timestamp: '2026-03-12T00:00:02.000Z',
    });

    const source = new MockEventSource([[event1], [event1, event2]]);
    const configResult = parseRunnerConfigInput({
      timeoutMs: 100,
      pollMs: 10,
    });
    if (!configResult.ok) {
      throw new Error(`Invalid test config: ${JSON.stringify(configResult.error)}`);
    }

    const result = await runValidation({ flow, config: configResult.value, source }, createDeterministicClock());

    assert.equal(result.status, 'pass');
    assert.equal(result.totalFetchedEvents, 2);
    assert.equal(result.totalUniqueEvents, 2);
    assert.equal(result.iterations.length, 2);
  });
});

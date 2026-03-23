import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { evaluateOrderRule } from '../../../core/validation/evaluators/evaluateOrderRule';
import { createEvent, createFlow } from '../../helpers/factories';

describe('evaluateOrderRule', () => {
  const createOrderRule = () => {
    const flow = createFlow({
      flowId: 'flow-order',
      rules: [
        {
          kind: 'order',
          id: 'rule-order-1',
          beforeEventType: 'PAYMENT_STARTED',
          afterEventType: 'PAYMENT_COMPLETED',
        },
      ],
    });
    const rule = flow.rules[0];
    if (rule === undefined || rule.kind !== 'order') {
      throw new Error('Fixture produced wrong rule type.');
    }

    return rule;
  };

  it('passes when first before occurs before first after', () => {
    const rule = createOrderRule();
    const events = [
      createEvent({
        id: 'event-before',
        eventType: 'PAYMENT_STARTED',
        timestamp: '2026-03-10T10:00:00.000Z',
      }),
      createEvent({
        id: 'event-after',
        eventType: 'PAYMENT_COMPLETED',
        timestamp: '2026-03-10T10:01:00.000Z',
      }),
    ];

    const result = evaluateOrderRule(rule, events);

    assert.equal(result.passed, true);
    assert.equal(result.violations.length, 0);
    assert.equal(result.evidenceEventIds.length, 2);
  });

  it('fails with order_missing_before when before events are absent', () => {
    const rule = createOrderRule();
    const events = [
      createEvent({
        id: 'event-after-only',
        eventType: 'PAYMENT_COMPLETED',
        timestamp: '2026-03-10T10:01:00.000Z',
      }),
    ];

    const result = evaluateOrderRule(rule, events);

    assert.equal(result.passed, false);
    assert.equal(
      result.violations.some((v) => v.code === 'order_missing_before'),
      true,
    );
  });

  it('fails with order_missing_after when after events are absent', () => {
    const rule = createOrderRule();
    const events = [
      createEvent({
        id: 'event-before-only',
        eventType: 'PAYMENT_STARTED',
        timestamp: '2026-03-10T10:00:00.000Z',
      }),
    ];

    const result = evaluateOrderRule(rule, events);

    assert.equal(result.passed, false);
    assert.equal(
      result.violations.some((v) => v.code === 'order_missing_after'),
      true,
    );
  });

  it('fails with order_incorrect_sequence when first after is earlier than first before', () => {
    const rule = createOrderRule();
    const events = [
      createEvent({
        id: 'event-after-early',
        eventType: 'PAYMENT_COMPLETED',
        timestamp: '2026-03-10T09:59:00.000Z',
      }),
      createEvent({
        id: 'event-before-late',
        eventType: 'PAYMENT_STARTED',
        timestamp: '2026-03-10T10:00:00.000Z',
      }),
      createEvent({
        id: 'event-after-later',
        eventType: 'PAYMENT_COMPLETED',
        timestamp: '2026-03-10T10:03:00.000Z',
      }),
    ];

    const result = evaluateOrderRule(rule, events);

    assert.equal(result.passed, false);
    assert.equal(
      result.violations.some((v) => v.code === 'order_incorrect_sequence'),
      true,
    );
  });
});

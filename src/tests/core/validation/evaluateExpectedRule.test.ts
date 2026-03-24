import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { evaluateExpectedRule } from '../../../core/validation/evaluators/evaluateExpectedRule';
import { createEvent, createFlow } from '../../helpers/factories';

describe('evaluateExpectedRule', () => {
  it('passes when the expected event type exists', () => {
    const flow = createFlow({
      flowId: 'flow-expected-pass',
      rules: [{ kind: 'expected', id: 'rule-1', eventType: 'PAYMENT_COMPLETED' }],
    });
    const rule = flow.rules[0];
    if (rule === undefined || rule.kind !== 'expected') {
      throw new Error('Fixture produced wrong rule type.');
    }

    const events = [
      createEvent({
        id: 'event-1',
        eventType: 'PAYMENT_COMPLETED',
        timestamp: '2026-03-10T10:00:00.000Z',
      }),
    ];

    const result = evaluateExpectedRule(rule, events);

    assert.equal(result.passed, true);
    assert.equal(result.violations.length, 0);
    assert.equal(result.evidenceEventIds.length, 1);
    assert.equal(result.stats.matchedCount, 1);
  });

  it('fails with expected_missing when no matching events exist', () => {
    const flow = createFlow({
      flowId: 'flow-expected-fail',
      rules: [{ kind: 'expected', id: 'rule-1', eventType: 'PAYMENT_COMPLETED' }],
    });
    const rule = flow.rules[0];
    if (rule === undefined || rule.kind !== 'expected') {
      throw new Error('Fixture produced wrong rule type.');
    }

    const events = [
      createEvent({
        id: 'event-2',
        eventType: 'PAYMENT_FAILED',
        timestamp: '2026-03-10T10:01:00.000Z',
      }),
    ];

    const result = evaluateExpectedRule(rule, events);
    const violation = result.violations[0];
    if (violation === undefined) {
      throw new Error('Expected a violation but got none.');
    }

    assert.equal(result.passed, false);
    assert.equal(result.violations.length, 1);
    assert.equal(violation.code, 'expected_missing');
    assert.equal(result.evidenceEventIds.length, 0);
    assert.equal(result.stats.matchedCount, 0);
  });
});

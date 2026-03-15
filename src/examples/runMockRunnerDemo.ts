import { parseFlowDefinition } from "../parsing/flow/parseFlowDefinition";
import { parseRunnerConfigInput } from "../parsing/config/parseRunnerConfig";
import { parseTraceEvent } from "../parsing/events/parseTraceEvent";
import { runValidation } from "../core/runner/validationRunner";
import { MockEventSource } from "../sources/mock/mockEventSource";
import type { TraceEvent } from "../models/internal/event";

const createEvent = (input: {
  readonly id: string;
  readonly eventType: string;
  readonly timestamp: string;
  readonly runId: string;
}): TraceEvent => {
  const parsed = parseTraceEvent({
    id: input.id,
    eventType: input.eventType,
    timestamp: input.timestamp,
    source: "demo-source",
    payload: {},
    runId: input.runId,
  });

  if (!parsed.ok) {
    throw new Error(`Invalid demo event: ${JSON.stringify(parsed.error)}`);
  }

  return parsed.value;
};

const runDemo = async (): Promise<void> => {
  const flowResult = parseFlowDefinition({
    flowId: "demo-checkout-flow",
    version: 1,
    rules: [
      { kind: "expected", id: "rule-expected-start", eventType: "PAYMENT_STARTED" },
      { kind: "forbidden", id: "rule-no-failed", eventType: "PAYMENT_FAILED" },
      {
        kind: "order",
        id: "rule-order",
        beforeEventType: "PAYMENT_STARTED",
        afterEventType: "PAYMENT_COMPLETED",
      },
    ],
  });
  if (!flowResult.ok) {
    throw new Error(`Invalid demo flow: ${JSON.stringify(flowResult.error)}`);
  }

  const configResult = parseRunnerConfigInput({
    runId: "run-42",
    timeoutMs: 3000,
    pollMs: 250,
  });
  if (!configResult.ok) {
    throw new Error(`Invalid demo config: ${JSON.stringify(configResult.error)}`);
  }
  if (configResult.value.runId === undefined) {
    throw new Error("Demo config must include runId.");
  }

  const batches = [
    [
      createEvent({
        id: "event-1",
        eventType: "PAYMENT_STARTED",
        timestamp: "2026-03-12T15:00:00.000Z",
        runId: "run-42",
      }),
    ],
    [
      createEvent({
        id: "event-2",
        eventType: "PAYMENT_COMPLETED",
        timestamp: "2026-03-12T15:00:01.000Z",
        runId: "run-42",
      }),
    ],
  ];

  const source = new MockEventSource(batches);
  const result = await runValidation(
    {
      flow: flowResult.value,
      config: configResult.value,
      source,
      selector: { runId: configResult.value.runId },
    },
  );

  console.log("=== Validation Runner Demo ===");
  result.iterations.forEach((iteration) => {
    console.log(
      [
        `iteration=${iteration.iteration}`,
        `fetched=${iteration.fetchedEventCount}`,
        `uniqueAdded=${iteration.uniqueAddedEventCount}`,
        `collected=${iteration.collectedEventCount}`,
        `validationStatus=${iteration.validationStatus}`,
        `violations=${iteration.violationCount}`,
      ].join(" | "),
    );
  });
  console.log(
    `finalStatus=${result.status} | totalFetched=${result.totalFetchedEvents} | totalUnique=${result.totalUniqueEvents} | elapsedMs=${result.elapsedMs}`,
  );
  console.log(`finalReportStatus=${result.finalReport.status}`);
};

void runDemo();

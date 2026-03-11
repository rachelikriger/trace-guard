import { parseTraceEvent } from "../../parsing/events/parseTraceEvent";
import { parseFlowDefinition } from "../../parsing/flow/parseFlowDefinition";
import type { TraceEvent } from "../../core/models/event";
import type { FlowDefinition } from "../../core/models/flow";

export const createEvent = (input: {
  readonly id: string;
  readonly eventType: string;
  readonly timestamp: string;
  readonly source?: string;
  readonly runId?: string;
  readonly correlationId?: string;
  readonly payload?: unknown;
}): TraceEvent => {
  const parsed = parseTraceEvent({
    id: input.id,
    eventType: input.eventType,
    timestamp: input.timestamp,
    source: input.source ?? "test-source",
    payload: input.payload ?? {},
    ...(input.runId !== undefined ? { runId: input.runId } : {}),
    ...(input.correlationId !== undefined ? { correlationId: input.correlationId } : {}),
  });

  if (!parsed.ok) {
    throw new Error(`Failed to create event fixture: ${JSON.stringify(parsed.error)}`);
  }

  return parsed.value;
};

export const createFlow = (input: {
  readonly flowId: string;
  readonly version?: number;
  readonly description?: string;
  readonly rules: unknown[];
}): FlowDefinition => {
  const parsed = parseFlowDefinition({
    flowId: input.flowId,
    version: input.version ?? 1,
    ...(input.description !== undefined ? { description: input.description } : {}),
    rules: input.rules,
  });

  if (!parsed.ok) {
    throw new Error(`Failed to create flow fixture: ${JSON.stringify(parsed.error)}`);
  }

  return parsed.value;
};

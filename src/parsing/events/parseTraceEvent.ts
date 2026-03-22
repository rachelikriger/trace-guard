import type { RawTraceEvent } from "../../models/raw/event";
import type { ParseIssue } from "../../core/types/parseIssue";
import type { ParseResult } from "../../core/types/parseResult";
import type { TraceEvent } from "../../models/internal/event";
import { failure, success } from "../../core/types/result";
import {
  asRecord,
  combineIssues,
  parseIsoDate,
  mustGet,
  parseNonEmptyString,
  parseOptionalNonEmptyString,
  toBrand,
  fail,
} from "../common/parsers";

const parseRawTraceEvent = (input: unknown): ParseResult<RawTraceEvent> => {
  const recordResult: ParseResult<Record<string, unknown>> = asRecord(input, "event");
  if (!recordResult.ok) {
    return recordResult;
  }

  const eventRecord: Record<string, unknown> = recordResult.value;
  const idResult: ParseResult<string> = parseNonEmptyString(eventRecord.id, "event.id");
  const eventTypeResult: ParseResult<string> = parseNonEmptyString(
    eventRecord.eventType,
    "event.eventType",
  );
  const timestampResult: ParseResult<string> = parseNonEmptyString(
    eventRecord.timestamp,
    "event.timestamp",
  );
  const sourceResult: ParseResult<string> = parseNonEmptyString(eventRecord.source, "event.source");
  const runIdResult: ParseResult<string | undefined> = parseOptionalNonEmptyString(
    eventRecord.runId,
    "event.runId",
  );
  const correlationIdResult: ParseResult<string | undefined> = parseOptionalNonEmptyString(
    eventRecord.correlationId,
    "event.correlationId",
  );

  const payload: unknown = eventRecord.payload;
  if (payload === undefined) {
    return fail("missing_field", "event.payload", "Missing required field: payload.");
  }

  const issues: ParseIssue[] = combineIssues(
    idResult,
    eventTypeResult,
    timestampResult,
    sourceResult,
    runIdResult,
    correlationIdResult,
  );
  if (issues.length > 0) {
    return failure(issues);
  }

  const id: string = mustGet(idResult);
  const eventType: string = mustGet(eventTypeResult);
  const timestamp: string = mustGet(timestampResult);
  const source: string = mustGet(sourceResult);
  const runId: string | undefined = mustGet(runIdResult);
  const correlationId: string | undefined = mustGet(correlationIdResult);

  const rawEvent: RawTraceEvent = {
    id,
    eventType,
    timestamp,
    source,
    payload,
    ...(runId !== undefined ? { runId } : {}),
    ...(correlationId !== undefined ? { correlationId } : {}),
  };

  return success(rawEvent);
};

export const convertRawTraceEventToTraceEvent = (
  raw: RawTraceEvent,
): ParseResult<TraceEvent> => {
  const timestampResult: ParseResult<Date> = parseIsoDate(raw.timestamp, "event.timestamp");
  if (!timestampResult.ok) {
    return failure(timestampResult.error);
  }

  const timestamp: Date = timestampResult.value;
  const runId = raw.runId === undefined ? undefined : toBrand<"RunId">(raw.runId);
  const correlationId =
    raw.correlationId === undefined
      ? undefined
      : toBrand<"CorrelationId">(raw.correlationId);

  const normalized: TraceEvent = {
    id: toBrand<"EventId">(raw.id),
    eventType: toBrand<"EventType">(raw.eventType),
    timestamp,
    source: toBrand<"SourceName">(raw.source),
    payload: raw.payload,
    ...(runId !== undefined ? { runId } : {}),
    ...(correlationId !== undefined ? { correlationId } : {}),
  };

  return success(normalized);
};

export const parseTraceEvent = (input: unknown): ParseResult<TraceEvent> => {
  const rawResult: ParseResult<RawTraceEvent> = parseRawTraceEvent(input);
  if (!rawResult.ok) {
    return rawResult;
  }

  return convertRawTraceEventToTraceEvent(rawResult.value);
};

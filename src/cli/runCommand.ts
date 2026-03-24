import { readFile } from 'node:fs/promises';
import { parseFlowDefinition } from '../parsing/flow/parseFlowDefinition';
import { parseRunnerConfigInput } from '../parsing/config/parseRunnerConfig';
import { parseTraceEvent } from '../parsing/events/parseTraceEvent';
import { runValidation } from '../core/runner/validationRunner';
import type { ValidationRunResult } from '../core/runner/models/validationRunResult';
import type { EventScope } from '../core/validation/models/validationReport';
import type { ParseIssue } from '../core/types/parseIssue';
import type { TraceEvent } from '../models/internal/event';
import type { RunnerConfig } from '../models/internal/runnerConfig';
import { FileEventSource } from '../sources/file/fileEventSource';

export interface RunCommandInput {
  readonly flowPath: string;
  readonly configPath: string;
  readonly eventsPath: string;
}

export interface RunCommandCompletedResult {
  readonly kind: 'run_completed';
  readonly exitCode: 0 | 1;
  readonly runResult: ValidationRunResult;
}

export interface RunCommandInputErrorResult {
  readonly kind: 'input_error';
  readonly exitCode: 2;
  readonly message: string;
}

export type RunCommandResult = RunCommandCompletedResult | RunCommandInputErrorResult;

const formatParseIssues = (issues: ParseIssue[]): string =>
  issues.map((issue: ParseIssue): string => `- [${issue.code}] ${issue.path}: ${issue.message}`).join('\n');

const readJsonFile = async (path: string): Promise<unknown> => {
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw) as unknown;
};

const parseEventsArray = (eventsInput: unknown): { ok: true; value: TraceEvent[] } | { ok: false; message: string } => {
  if (!Array.isArray(eventsInput)) {
    return { ok: false, message: 'Events file must contain a JSON array.' };
  }

  const events: TraceEvent[] = [];
  const parseErrors: string[] = [];

  eventsInput.forEach((eventInput: unknown, index: number) => {
    const parsed = parseTraceEvent(eventInput);
    if (parsed.ok) {
      events.push(parsed.value);
      return;
    }

    parseErrors.push(`Event at index ${index}:\n${formatParseIssues(parsed.error)}`);
  });

  if (parseErrors.length > 0) {
    return {
      ok: false,
      message: `Failed to parse events file.\n${parseErrors.join('\n')}`,
    };
  }

  return { ok: true, value: events };
};

const eventScopeFromConfig = (config: RunnerConfig): EventScope | undefined => {
  if (config.runId === undefined && config.correlationId === undefined) {
    return undefined;
  }

  return {
    ...(config.runId !== undefined ? { runId: config.runId } : {}),
    ...(config.correlationId !== undefined ? { correlationId: config.correlationId } : {}),
  };
};

export const runCommand = async (input: RunCommandInput): Promise<RunCommandResult> => {
  let flowJson: unknown;
  let configJson: unknown;
  let eventsJson: unknown;

  try {
    [flowJson, configJson, eventsJson] = await Promise.all([
      readJsonFile(input.flowPath),
      readJsonFile(input.configPath),
      readJsonFile(input.eventsPath),
    ]);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      kind: 'input_error',
      exitCode: 2,
      message: `Failed to read input files: ${errorMessage}`,
    };
  }

  const flowResult = parseFlowDefinition(flowJson);
  if (!flowResult.ok) {
    return {
      kind: 'input_error',
      exitCode: 2,
      message: `Flow parsing failed.\n${formatParseIssues(flowResult.error)}`,
    };
  }

  const configResult = parseRunnerConfigInput(configJson);
  if (!configResult.ok) {
    return {
      kind: 'input_error',
      exitCode: 2,
      message: `Config parsing failed.\n${formatParseIssues(configResult.error)}`,
    };
  }

  const eventsResult = parseEventsArray(eventsJson);
  if (!eventsResult.ok) {
    return {
      kind: 'input_error',
      exitCode: 2,
      message: eventsResult.message,
    };
  }

  const eventScope = eventScopeFromConfig(configResult.value);

  const source = new FileEventSource(eventsResult.value);
  const runOptions =
    eventScope === undefined
      ? {
          flow: flowResult.value,
          config: configResult.value,
          source,
        }
      : {
          flow: flowResult.value,
          config: configResult.value,
          source,
          eventScope,
        };
  const runResult = await runValidation(runOptions);

  return {
    kind: 'run_completed',
    exitCode: runResult.status === 'pass' ? 0 : 1,
    runResult,
  };
};

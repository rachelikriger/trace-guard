/**
 * Preferred high-level entrypoint for library consumers.
 *
 * Keep this file focused on the common, stable API surface.
 * Domain-specific APIs are available through dedicated submodules:
 * - trace-guard/parsing
 * - trace-guard/validation
 */
export type { RawTraceEvent } from './models/raw/event';
export type { RawFlowDefinition, RawRule } from './models/raw/flow';
export type { RawRunnerConfig } from './models/raw/runnerConfig';
export type { ParseIssue, ParseIssueCode } from './core/types/parseIssue';
export type { TraceEvent } from './models/internal/event';
export type { FlowDefinition, Rule } from './models/internal/flow';
export type { RunnerConfig } from './models/internal/runnerConfig';
export type { ParseResult } from './core/types/parseResult';
export type { Result } from './core/types/result';
export type { EventId, FlowId, RuleId, RunId, CorrelationId, EventType } from './core/types/brand';
export type { EventCursor, EventSource, EventSourcePollRequest, EventSourcePollResponse } from './sources/eventSource';
export type { ElasticClient, ElasticSearchRequest, ElasticSearchResponse, ElasticSearchHit } from './sources/elastic/elasticClient';
export type { ElasticFieldConfig, ElasticEventSourceConfig } from './sources/elastic/elasticEventSource';
export type { ElasticHttpClientOptions } from './sources/elastic/elasticHttpClient';

export { failure, success } from './core/types/result';
export { convertRawTraceEventToTraceEvent, parseTraceEvent } from './parsing/events/parseTraceEvent';
export { convertRawFlowDefinitionToFlowDefinition, parseFlowDefinition } from './parsing/flow/parseFlowDefinition';
export { convertRawRunnerConfigToRunnerConfig, parseRunnerConfig, parseRunnerConfigInput } from './parsing/config/parseRunnerConfig';
export { runValidation } from './core/runner/validationRunner';
export { ElasticEventSource } from './sources/elastic/elasticEventSource';
export { ElasticHttpClient } from './sources/elastic/elasticHttpClient';

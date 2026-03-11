export type Brand<TValue, TBrand extends string> = TValue & {
  readonly __brand: TBrand;
};

export type EventId = Brand<string, "EventId">;
export type FlowId = Brand<string, "FlowId">;
export type RuleId = Brand<string, "RuleId">;
export type RunId = Brand<string, "RunId">;
export type CorrelationId = Brand<string, "CorrelationId">;
export type EventType = Brand<string, "EventType">;
export type SourceName = Brand<string, "SourceName">;

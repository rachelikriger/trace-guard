export type Brand<TValue, TBrand extends string> = TValue & {
  readonly __brand: TBrand;
};

// Branded types are compile-time only and should be used only for IDs that are easy to mix up.
export type EventId = Brand<string, 'EventId'>;
export type FlowId = Brand<string, 'FlowId'>;
export type RuleId = Brand<string, 'RuleId'>;
export type RunId = Brand<string, 'RunId'>;
export type CorrelationId = Brand<string, 'CorrelationId'>;
export type EventType = Brand<string, 'EventType'>;

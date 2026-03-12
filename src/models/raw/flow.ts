export type RawRuleKind = "expected" | "forbidden" | "order";

export interface RawExpectedRule {
  readonly kind: "expected";
  readonly id: string;
  readonly eventType: string;
}

export interface RawForbiddenRule {
  readonly kind: "forbidden";
  readonly id: string;
  readonly eventType: string;
}

export interface RawOrderRule {
  readonly kind: "order";
  readonly id: string;
  readonly beforeEventType: string;
  readonly afterEventType: string;
}

export type RawRule = RawExpectedRule | RawForbiddenRule | RawOrderRule;

export interface RawFlowDefinition {
  readonly flowId: string;
  readonly version: number;
  readonly description?: string;
  readonly rules: RawRule[];
}

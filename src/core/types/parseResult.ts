import type { ParseIssue } from "./parseIssue";
import type { Result } from "./result";

export type ParseResult<T> = Result<T, ParseIssue[]>;

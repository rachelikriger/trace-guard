export type ParseIssueCode =
  | 'invalid_type'
  | 'missing_field'
  | 'invalid_literal'
  | 'invalid_date'
  | 'invalid_number'
  | 'out_of_range'
  | 'empty_string';

export interface ParseIssue {
  readonly code: ParseIssueCode;
  readonly path: string;
  readonly message: string;
  readonly input?: unknown;
}

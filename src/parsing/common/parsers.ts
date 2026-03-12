import type { ParseIssue, ParseIssueCode } from "../../core/types/parseIssue";
import type { Brand } from "../../core/types/brand";
import type { ParseResult } from "../../core/types/parseResult";
import { failure, success } from "../../core/types/result";

const createIssue = (
  code: ParseIssueCode,
  path: string,
  message: string,
  input?: unknown,
): ParseIssue => ({
  code,
  path,
  message,
  input,
});

export const fail = (
  code: ParseIssueCode,
  path: string,
  message: string,
  input?: unknown,
): ParseResult<never> => failure([createIssue(code, path, message, input)]);

export const combineIssues = (...results: Array<ParseResult<unknown>>): ParseIssue[] =>
  results.flatMap((result: ParseResult<unknown>) =>
    result.ok ? [] : result.error,
  );

export const mustGet = <T>(result: ParseResult<T>): T => {
  if (!result.ok) {
    throw new Error("Attempted to read value from failed ParseResult.");
  }

  return result.value;
};

export const asRecord = (value: unknown, path: string): ParseResult<Record<string, unknown>> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return fail("invalid_type", path, "Expected an object.", value);
  }

  return success(value as Record<string, unknown>);
};

export const parseNonEmptyString = (
  value: unknown,
  path: string,
): ParseResult<string> => {
  if (typeof value !== "string") {
    return fail("invalid_type", path, "Expected a string.", value);
  }

  const trimmed: string = value.trim();
  if (trimmed.length === 0) {
    return fail("empty_string", path, "Expected a non-empty string.", value);
  }

  return success(trimmed);
};

export const parseOptionalNonEmptyString = (
  value: unknown,
  path: string,
): ParseResult<string | undefined> => {
  if (value === undefined) {
    return success(undefined);
  }

  const parsed: ParseResult<string> = parseNonEmptyString(value, path);
  return parsed.ok ? success(parsed.value) : parsed;
};

export const parseFiniteNumber = (value: unknown, path: string): ParseResult<number> => {
  if (typeof value === "number") {
    if (Number.isFinite(value)) {
      return success(value);
    }

    return fail("invalid_number", path, "Expected a finite number.", value);
  }

  if (typeof value === "string") {
    const trimmed: string = value.trim();
    if (trimmed.length === 0) {
      return fail("empty_string", path, "Expected a numeric string.", value);
    }

    const asNumber: number = Number(trimmed);
    if (Number.isFinite(asNumber)) {
      return success(asNumber);
    }

    return fail("invalid_number", path, "Expected a numeric string.", value);
  }

  return fail("invalid_type", path, "Expected a number or numeric string.", value);
};

export const parsePositiveInteger = (
  value: unknown,
  path: string,
): ParseResult<number> => {
  const parsed: ParseResult<number> = parseFiniteNumber(value, path);
  if (!parsed.ok) {
    return parsed;
  }

  if (!Number.isInteger(parsed.value)) {
    return fail("invalid_number", path, "Expected an integer number.", value);
  }

  if (parsed.value <= 0) {
    return fail("out_of_range", path, "Expected a value greater than zero.", value);
  }

  return success(parsed.value);
};

export const parsePositiveIntegerFromNumber = (
  value: unknown,
  path: string,
): ParseResult<number> => {
  if (typeof value !== "number") {
    return fail("invalid_type", path, "Expected a number.", value);
  }

  if (!Number.isInteger(value)) {
    return fail("invalid_number", path, "Expected an integer number.", value);
  }

  if (value <= 0) {
    return fail("out_of_range", path, "Expected a value greater than zero.", value);
  }

  return success(value);
};

export const parseOptionalPositiveInteger = (
  value: unknown,
  path: string,
): ParseResult<number | undefined> => {
  if (value === undefined) {
    return success(undefined);
  }

  const parsed: ParseResult<number> = parsePositiveInteger(value, path);
  return parsed.ok ? success(parsed.value) : parsed;
};

export const parseIsoDate = (value: unknown, path: string): ParseResult<Date> => {
  if (typeof value !== "string") {
    return fail("invalid_type", path, "Expected an ISO date string.", value);
  }

  const candidate: Date = new Date(value);
  if (Number.isNaN(candidate.getTime())) {
    return fail("invalid_date", path, "Invalid date format.", value);
  }

  return success(candidate);
};

export const parseOptionalIsoDate = (
  value: unknown,
  path: string,
): ParseResult<Date | undefined> => {
  if (value === undefined) {
    return success(undefined);
  }

  const parsed: ParseResult<Date> = parseIsoDate(value, path);
  return parsed.ok ? success(parsed.value) : parsed;
};

export const toBrand = <TBrand extends string>(
  value: string,
): Brand<string, TBrand> => value as Brand<string, TBrand>;

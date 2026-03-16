import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { runCli } from "../../cli/index";

const createTempJson = async (
  tempDir: string,
  fileName: string,
  value: unknown,
): Promise<string> => {
  const filePath = join(tempDir, fileName);
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
  return filePath;
};

const runCliSilently = async (argv: string[]): Promise<number> => {
  const originalLog = console.log;
  const originalError = console.error;
  console.log = (): void => {};
  console.error = (): void => {};

  try {
    return await runCli(argv);
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
};

describe("runCli", () => {
  it("returns 0 when validation passes", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "trace-guard-cli-pass-"));
    try {
      const flowPath = await createTempJson(tempDir, "flow.json", {
        flowId: "flow-pass",
        version: 1,
        rules: [{ kind: "expected", id: "rule-1", eventType: "PAYMENT_STARTED" }],
      });
      const configPath = await createTempJson(tempDir, "config.json", {
        timeoutMs: 50,
        pollMs: 10,
      });
      const eventsPath = await createTempJson(tempDir, "events.json", [
        {
          id: "event-1",
          eventType: "PAYMENT_STARTED",
          timestamp: "2026-03-12T15:00:00.000Z",
          source: "test",
          payload: {},
        },
      ]);

      const exitCode = await runCliSilently([
        "run",
        "--flow",
        flowPath,
        "--config",
        configPath,
        "--events",
        eventsPath,
      ]);

      assert.equal(exitCode, 0);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("returns 1 when validation times out", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "trace-guard-cli-timeout-"));
    try {
      const flowPath = await createTempJson(tempDir, "flow.json", {
        flowId: "flow-timeout",
        version: 1,
        rules: [{ kind: "expected", id: "rule-1", eventType: "PAYMENT_COMPLETED" }],
      });
      const configPath = await createTempJson(tempDir, "config.json", {
        timeoutMs: 25,
        pollMs: 10,
      });
      const eventsPath = await createTempJson(tempDir, "events.json", [
        {
          id: "event-1",
          eventType: "PAYMENT_STARTED",
          timestamp: "2026-03-12T15:00:00.000Z",
          source: "test",
          payload: {},
        },
      ]);

      const exitCode = await runCliSilently([
        "run",
        "--flow",
        flowPath,
        "--config",
        configPath,
        "--events",
        eventsPath,
      ]);

      assert.equal(exitCode, 1);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("returns 2 when input parsing fails", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "trace-guard-cli-input-error-"));
    try {
      const flowPath = await createTempJson(tempDir, "flow.json", {
        flowId: "flow-invalid",
        version: 1,
      });
      const configPath = await createTempJson(tempDir, "config.json", {
        timeoutMs: 50,
        pollMs: 10,
      });
      const eventsPath = await createTempJson(tempDir, "events.json", []);

      const exitCode = await runCliSilently([
        "run",
        "--flow",
        flowPath,
        "--config",
        configPath,
        "--events",
        eventsPath,
      ]);

      assert.equal(exitCode, 2);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

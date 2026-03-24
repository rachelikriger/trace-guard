import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { runCli } from '../../cli/index';

const createTempJson = async (tempDir: string, fileName: string, value: unknown): Promise<string> => {
  const filePath = join(tempDir, fileName);
  await writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
  return filePath;
};

interface CapturedCliResult {
  readonly exitCode: number;
  readonly stdout: string[];
  readonly stderr: string[];
}

const runCliCaptured = async (argv: string[]): Promise<CapturedCliResult> => {
  const originalLog = console.log;
  const originalError = console.error;
  const stdout: string[] = [];
  const stderr: string[] = [];
  console.log = (...args: unknown[]): void => {
    stdout.push(args.map((arg: unknown): string => String(arg)).join(' '));
  };
  console.error = (...args: unknown[]): void => {
    stderr.push(args.map((arg: unknown): string => String(arg)).join(' '));
  };

  try {
    const exitCode = await runCli(argv);
    return { exitCode, stdout, stderr };
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
};

describe('runCli', () => {
  it('returns 0 and prints help for --help', async () => {
    const result = await runCliCaptured(['--help']);
    assert.equal(result.exitCode, 0);
    assert.ok(result.stdout.some((line: string): boolean => line.includes('Trace-Guard CLI')));
    assert.equal(result.stderr.length, 0);
  });

  it('returns 0 and prints help for run --help', async () => {
    const result = await runCliCaptured(['run', '--help']);
    assert.equal(result.exitCode, 0);
    assert.ok(result.stdout.some((line: string): boolean => line.includes('Usage:')));
    assert.equal(result.stderr.length, 0);
  });

  it('returns 0 when validation passes', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'trace-guard-cli-pass-'));
    try {
      const flowPath = await createTempJson(tempDir, 'flow.json', {
        flowId: 'flow-pass',
        version: 1,
        rules: [{ kind: 'expected', id: 'rule-1', eventType: 'PAYMENT_STARTED' }],
      });
      const configPath = await createTempJson(tempDir, 'config.json', {
        timeoutMs: 50,
        pollMs: 10,
      });
      const eventsPath = await createTempJson(tempDir, 'events.json', [
        {
          id: 'event-1',
          eventType: 'PAYMENT_STARTED',
          timestamp: '2026-03-12T15:00:00.000Z',
          source: 'test',
          payload: {},
        },
      ]);

      const result = await runCliCaptured(['run', '--flow', flowPath, '--config', configPath, '--events', eventsPath]);

      assert.equal(result.exitCode, 0);
      assert.ok(result.stdout.some((line: string): boolean => line.includes('Status: PASS')));
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('returns 1 when validation times out', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'trace-guard-cli-timeout-'));
    try {
      const flowPath = await createTempJson(tempDir, 'flow.json', {
        flowId: 'flow-timeout',
        version: 1,
        rules: [{ kind: 'expected', id: 'rule-1', eventType: 'PAYMENT_COMPLETED' }],
      });
      const configPath = await createTempJson(tempDir, 'config.json', {
        timeoutMs: 25,
        pollMs: 10,
      });
      const eventsPath = await createTempJson(tempDir, 'events.json', [
        {
          id: 'event-1',
          eventType: 'PAYMENT_STARTED',
          timestamp: '2026-03-12T15:00:00.000Z',
          source: 'test',
          payload: {},
        },
      ]);

      const result = await runCliCaptured(['run', '--flow', flowPath, '--config', configPath, '--events', eventsPath]);

      assert.equal(result.exitCode, 1);
      assert.ok(result.stdout.some((line: string): boolean => line.includes('Status: TIMEOUT')));
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('returns 2 when input parsing fails', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'trace-guard-cli-input-error-'));
    try {
      const flowPath = await createTempJson(tempDir, 'flow.json', {
        flowId: 'flow-invalid',
        version: 1,
      });
      const configPath = await createTempJson(tempDir, 'config.json', {
        timeoutMs: 50,
        pollMs: 10,
      });
      const eventsPath = await createTempJson(tempDir, 'events.json', []);

      const result = await runCliCaptured(['run', '--flow', flowPath, '--config', configPath, '--events', eventsPath]);

      assert.equal(result.exitCode, 2);
      assert.ok(result.stderr.some((line: string): boolean => line.includes('Input error:')));
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('returns 2 and usage when required options are missing', async () => {
    const result = await runCliCaptured(['run', '--flow', 'flow.json']);
    assert.equal(result.exitCode, 2);
    assert.ok(result.stderr.some((line: string): boolean => line.includes('Missing required options')));
    assert.ok(result.stderr.some((line: string): boolean => line.includes('Usage:')));
  });

  it('returns 2 for unknown options', async () => {
    const result = await runCliCaptured(['run', '--flow', 'flow.json', '--config', 'config.json', '--events', 'events.json', '--wat']);
    assert.equal(result.exitCode, 2);
    assert.ok(result.stderr.some((line: string): boolean => line.includes('Unknown options: --wat')));
  });

  it('prints JSON output when --output json is provided', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'trace-guard-cli-json-'));
    try {
      const flowPath = await createTempJson(tempDir, 'flow.json', {
        flowId: 'flow-json',
        version: 1,
        rules: [{ kind: 'expected', id: 'rule-1', eventType: 'PAYMENT_STARTED' }],
      });
      const configPath = await createTempJson(tempDir, 'config.json', {
        timeoutMs: 50,
        pollMs: 10,
      });
      const eventsPath = await createTempJson(tempDir, 'events.json', [
        {
          id: 'event-1',
          eventType: 'PAYMENT_STARTED',
          timestamp: '2026-03-12T15:00:00.000Z',
          source: 'test',
          payload: {},
        },
      ]);

      const result = await runCliCaptured([
        'run',
        '--flow',
        flowPath,
        '--config',
        configPath,
        '--events',
        eventsPath,
        '--output',
        'json',
      ]);

      assert.equal(result.exitCode, 0);
      assert.equal(result.stderr.length, 0);
      assert.equal(result.stdout.length, 1);

      const firstLine = result.stdout[0];
      if (firstLine === undefined) {
        throw new Error('Expected one stdout line');
      }
      const payload = JSON.parse(firstLine) as { kind: string; exitCode: number };
      assert.equal(payload.kind, 'run_completed');
      assert.equal(payload.exitCode, 0);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

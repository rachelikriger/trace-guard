import { runCommand } from './runCommand';
import { printInputError, printRunResult } from './printRunResult';
import type { ValidationRunResult } from '../core/runner/models/validationRunResult';

interface RunPaths {
  readonly flowPath: string;
  readonly configPath: string;
  readonly eventsPath: string;
}

type OutputMode = 'human' | 'json';

interface RunOptions extends RunPaths {
  readonly output: OutputMode;
}

type ParseRunOptionsResult = { ok: true; value: RunOptions } | { ok: false; message: string };

const usage = 'trace-guard run --flow <flow.json> --config <config.json> --events <events.json> [--output <human|json>]';
const helpText = [
  'Trace-Guard CLI',
  '',
  'Usage:',
  `  ${usage}`,
  '  trace-guard --help',
  '',
  'Options:',
  '  --flow <path>     Flow definition JSON file (required for run)',
  '  --config <path>   Runner config JSON file (required for run)',
  '  --events <path>   Events JSON array file (required for run)',
  '  --output <mode>   Output mode: human | json (default: human)',
  '  --help            Show this help text',
].join('\n');

const knownOptions = new Set<Readonly<RunOptionName>>(['--flow', '--config', '--events', '--output', '--help']);
type RunOptionName = '--flow' | '--config' | '--events' | '--output' | '--help';

const readOptionValue = (args: readonly string[], optionName: RunOptionName): string | undefined => {
  const optionIndex = args.indexOf(optionName);
  if (optionIndex < 0) {
    return undefined;
  }

  const value = args[optionIndex + 1];
  if (value === undefined || value.startsWith('--')) {
    return undefined;
  }

  return value;
};

const findUnknownOptions = (args: readonly string[]): string[] =>
  args.filter((arg: string): boolean => arg.startsWith('--') && !knownOptions.has(arg as RunOptionName));

const parseRunOptions = (args: readonly string[]): ParseRunOptionsResult => {
  const unknownOptions = findUnknownOptions(args);
  if (unknownOptions.length > 0) {
    return {
      ok: false,
      message: `Unknown options: ${unknownOptions.join(', ')}`,
    };
  }

  const flowPath = readOptionValue(args, '--flow');
  const configPath = readOptionValue(args, '--config');
  const eventsPath = readOptionValue(args, '--events');
  const outputRaw = readOptionValue(args, '--output');

  if (flowPath === undefined || configPath === undefined || eventsPath === undefined) {
    return {
      ok: false,
      message: 'Missing required options. Expected --flow, --config, --events with values.',
    };
  }

  if (outputRaw !== undefined && outputRaw !== 'human' && outputRaw !== 'json') {
    return {
      ok: false,
      message: `Invalid value for --output: ${outputRaw}. Allowed values: human, json.`,
    };
  }

  return {
    ok: true,
    value: {
      flowPath,
      configPath,
      eventsPath,
      output: outputRaw ?? 'human',
    },
  };
};

const printRunResultJson = (runResult: ValidationRunResult, exitCode: 0 | 1): void => {
  console.log(
    JSON.stringify(
      {
        kind: 'run_completed',
        exitCode,
        runResult,
      },
      null,
      2,
    ),
  );
};

const printInputErrorJson = (message: string): void => {
  console.error(
    JSON.stringify(
      {
        kind: 'input_error',
        exitCode: 2,
        message,
      },
      null,
      2,
    ),
  );
};

export const runCli = async (argv: readonly string[]): Promise<number> => {
  const [command, ...rest] = argv;
  if (command === '--help' || command === '-h') {
    console.log(helpText);
    return 0;
  }

  if (command !== 'run') {
    console.error(`Unknown command: ${command ?? '(none)'}`);
    console.error(`Usage:\n  ${usage}`);
    return 2;
  }
  if (rest.includes('--help') || rest.includes('-h')) {
    console.log(helpText);
    return 0;
  }

  const optionsResult = parseRunOptions(rest);
  if (!optionsResult.ok) {
    console.error(optionsResult.message);
    console.error(`Usage:\n  ${usage}`);
    return 2;
  }

  const options = optionsResult.value;
  const result = await runCommand(options);
  if (result.kind === 'input_error') {
    if (options.output === 'json') {
      printInputErrorJson(result.message);
    } else {
      printInputError(result.message);
    }
    return result.exitCode;
  }

  if (options.output === 'json') {
    printRunResultJson(result.runResult, result.exitCode);
  } else {
    printRunResult(result.runResult);
  }

  return result.exitCode;
};

const main = async (): Promise<void> => {
  const exitCode = await runCli(process.argv.slice(2));
  process.exitCode = exitCode;
};

if (require.main === module) {
  void main();
}

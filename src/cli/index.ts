import { runCommand } from './runCommand';
import { printInputError, printRunResult } from './printRunResult';

interface RunPaths {
  readonly flowPath: string;
  readonly configPath: string;
  readonly eventsPath: string;
}

const usage = ['Usage:', '  trace-guardrun --flow <flow.json> --config <config.json> --events <events.json>'].join('\n');

const readOptionValue = (args: readonly string[], optionName: '--flow' | '--config' | '--events'): string | undefined => {
  const optionIndex = args.indexOf(optionName);
  if (optionIndex < 0) {
    return undefined;
  }

  return args[optionIndex + 1];
};

const parseRunPaths = (args: readonly string[]): RunPaths | undefined => {
  const flowPath = readOptionValue(args, '--flow');
  const configPath = readOptionValue(args, '--config');
  const eventsPath = readOptionValue(args, '--events');

  if (flowPath === undefined || configPath === undefined || eventsPath === undefined) {
    return undefined;
  }

  return { flowPath, configPath, eventsPath };
};

export const runCli = async (argv: readonly string[]): Promise<number> => {
  const [command, ...rest] = argv;
  if (command !== 'run') {
    console.error(usage);
    return 2;
  }

  const paths = parseRunPaths(rest);
  if (paths === undefined) {
    console.error(usage);
    return 2;
  }

  const result = await runCommand(paths);
  if (result.kind === 'input_error') {
    printInputError(result.message);
    return result.exitCode;
  }

  printRunResult(result.runResult);
  return result.exitCode;
};

const main = async (): Promise<void> => {
  const exitCode = await runCli(process.argv.slice(2));
  process.exitCode = exitCode;
};

if (require.main === module) {
  void main();
}

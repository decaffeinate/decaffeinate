import assert from 'assert';
import { readdir, readFile, stat, writeFile } from 'mz/fs';
import { basename, dirname, extname, join } from 'path';
import { convert, modernizeJS } from './index';
import { DEFAULT_OPTIONS, Options } from './options';
import PatchError from './utils/PatchError';

export interface IO {
  readonly stdin: NodeJS.ReadableStream;
  readonly stdout: NodeJS.WritableStream;
  readonly stderr: NodeJS.WritableStream;
}

/**
 * Run the script with the user-supplied arguments.
 */
export default async function run(
  args: ReadonlyArray<string>,
  io: IO = { stdin: process.stdin, stdout: process.stdout, stderr: process.stderr },
): Promise<number> {
  const parseResult = parseArguments(args, io);

  if (parseResult.kind === 'error') {
    io.stderr.write(`${parseResult.message}\n`);
    return 1;
  }

  const options = parseResult;

  if (options.help) {
    usage(args[0], io.stdout);
    return 0;
  }

  if (options.version) {
    version(io.stdout);
    return 0;
  }

  const success = options.paths.length
    ? await runWithPaths(options.paths, options, io)
    : await runWithStdio(options, io);

  return success ? 0 : 1;
}

type ParseOptionsResult = CLIOptions | ParseOptionsError;

interface CLIOptions {
  readonly kind: 'success';
  readonly paths: Array<string>;
  readonly baseOptions: Options;
  readonly modernizeJS: boolean;
  readonly version: boolean;
  readonly help: boolean;
}

interface ParseOptionsError {
  readonly kind: 'error';
  readonly message: string;
}

function parseArguments(args: ReadonlyArray<string>, io: IO): ParseOptionsResult {
  const paths = [];
  const baseOptions: Options = { ...DEFAULT_OPTIONS };
  let modernizeJS = false;
  let help = false;
  let version = false;

  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '-h':
      case '--help':
        help = true;
        break;

      case '-v':
      case '--version':
        version = true;
        break;

      case '--use-cs2':
        baseOptions.useCS2 = true;
        break;

      case '--modernize-js':
        modernizeJS = true;
        break;

      case '--bare':
      case '--no-bare':
        baseOptions.bare = arg === '--bare';
        break;

      case '--literate':
        baseOptions.literate = true;
        break;

      case '--disable-suggestion-comment':
        baseOptions.disableSuggestionComment = true;
        break;

      case '--no-array-includes':
        baseOptions.noArrayIncludes = true;
        break;

      case '--use-js-modules':
        baseOptions.useJSModules = true;
        break;

      case '--loose-js-modules':
        baseOptions.looseJSModules = true;
        break;

      case '--safe-import-function-identifiers':
        i++;
        baseOptions.safeImportFunctionIdentifiers = args[i].split(',');
        break;

      case '--prefer-let':
        baseOptions.preferLet = true;
        break;

      case '--disable-babel-constructor-workaround':
        io.stderr.write(`${arg} no longer has any effect as it is the only supported behavior\n`);
        break;

      case '--disallow-invalid-constructors':
        baseOptions.disallowInvalidConstructors = true;
        break;

      case '--loose':
        baseOptions.loose = true;
        break;

      case '--loose-default-params':
        baseOptions.looseDefaultParams = true;
        break;

      case '--loose-for-expressions':
        baseOptions.looseForExpressions = true;
        break;

      case '--loose-for-of':
        baseOptions.looseForOf = true;
        break;

      case '--loose-includes':
        baseOptions.looseIncludes = true;
        break;

      case '--loose-comparison-negation':
        baseOptions.looseComparisonNegation = true;
        break;

      // Legacy options that are now a no-op.
      case '--prefer-const':
      case '--keep-commonjs':
      case '--enable-babel-constructor-workaround':
        break;

      // Legacy options that are now aliases for other options.
      case '--force-default-export':
        baseOptions.useJSModules = true;
        break;

      case '--allow-invalid-constructors':
        baseOptions.disallowInvalidConstructors = false;
        break;

      case '--optional-chaining':
      case '--use-optional-chaining':
        baseOptions.optionalChaining = true;
        break;

      case '--logical-assignment':
        baseOptions.logicalAssignment = true;
        break;

      case '--nullish-coalescing':
        baseOptions.nullishCoalescing = true;
        break;

      default:
        if (arg.startsWith('-')) {
          return { kind: 'error', message: `unrecognized option: ${arg}` };
        }
        paths.push(arg);
        break;
    }
  }

  if (!baseOptions.bare && baseOptions.useJSModules) {
    return { kind: 'error', message: 'cannot use --use-js-modules with --no-bare' };
  }

  return { kind: 'success', paths, baseOptions, modernizeJS, version, help };
}

/**
 * Run decaffeinate on the given paths, changing them in place.
 */
async function runWithPaths(paths: Array<string>, options: CLIOptions, io: IO): Promise<boolean> {
  async function processPath(path: string): Promise<boolean> {
    const info = await stat(path);
    if (info.isDirectory()) {
      return await processDirectory(path);
    } else {
      return await processFile(path);
    }
  }

  async function processDirectory(path: string): Promise<boolean> {
    const children = await readdir(path);

    for (const child of children) {
      const childPath = join(path, child);
      const childStat = await stat(childPath);

      if (childStat.isDirectory()) {
        if (!(await processDirectory(childPath))) {
          return false;
        }
      } else if (options.modernizeJS) {
        if (child.endsWith('.js')) {
          if (!(await processPath(childPath))) {
            return false;
          }
        }
      } else if (child.endsWith('.coffee') || child.endsWith('.litcoffee') || child.endsWith('.coffee.md')) {
        if (!(await processPath(childPath))) {
          return false;
        }
      }
    }

    return true;
  }

  async function processFile(path: string): Promise<boolean> {
    const extension = path.endsWith('.coffee.md') ? '.coffee.md' : extname(path);
    const outputPath = join(dirname(path), basename(path, extension)) + '.js';
    io.stdout.write(`${path} → ${outputPath}\n`);
    const data = await readFile(path, 'utf8');
    const resultCode = runWithCode(path, data, options, io);
    const success = typeof resultCode === 'string';
    if (success) {
      await writeFile(outputPath, resultCode);
    }
    return success;
  }

  for (const path of paths) {
    if (!(await processPath(path))) {
      return false;
    }
  }

  return true;
}

async function runWithStdio(options: CLIOptions, io: IO): Promise<boolean> {
  return new Promise((resolve) => {
    let data = '';
    io.stdin.on('data', (chunk) => (data += chunk));
    io.stdin.on('end', () => {
      const resultCode = runWithCode('stdin', data, options, io);
      const success = typeof resultCode === 'string';
      if (success) {
        io.stdout.write(resultCode);
      }
      resolve(success);
    });
  });
}

/**
 * Run decaffeinate on the given code string and return the resulting code.
 */
function runWithCode(name: string, code: string, options: CLIOptions, io: IO): string | undefined {
  const baseOptions = Object.assign({ filename: name }, options.baseOptions);
  try {
    if (options.modernizeJS) {
      return modernizeJS(code, baseOptions).code;
    } else {
      return convert(code, baseOptions).code;
    }
  } catch (err: unknown) {
    assert(err instanceof Error);
    if (PatchError.detect(err)) {
      io.stderr.write(`${name}: ${PatchError.prettyPrint(err)}\n`);
      return undefined;
    }
    throw err;
  }
}

/**
 * Print version
 */
function version(out: NodeJS.WritableStream): void {
  out.write(`${__PACKAGE__} v${__VERSION__}`);
}

/**
 * Print usage help.
 */
function usage(exe: string, out: NodeJS.WritableStream): void {
  out.write(`${exe} [OPTIONS] PATH [PATH …]\n`);
  out.write(`${exe} [OPTIONS] < INPUT\n`);
  out.write('\n');
  out.write('Move your CoffeeScript source to JavaScript using modern syntax.\n');
  out.write('\n');
  out.write('OPTIONS\n');
  out.write('\n');
  out.write('  -h, --help               Display this help message.\n');
  out.write('  --use-cs2                Treat the input as CoffeeScript 2 code. CoffeeScript 2 has\n');
  out.write('                           some small breaking changes and differences in behavior\n');
  out.write('                           compared with CS1, so decaffeinate assumes CS1 by default\n');
  out.write('                           and allows CS2 via this flag.\n');
  out.write('  --modernize-js           Treat the input as JavaScript and only run the\n');
  out.write('                           JavaScript-to-JavaScript transforms, modifying the file(s)\n');
  out.write('                           in-place.\n');
  out.write('  --literate               Treat the input file as Literate CoffeeScript.\n');
  out.write('  --disable-suggestion-comment\n');
  out.write('                           Do not include a comment with followup suggestions at the\n');
  out.write('                           top of the output file.\n');
  out.write('  --no-array-includes      Do not use Array.prototype.includes in generated code.\n');
  out.write('  --use-js-modules         Convert require and module.exports to import and export.\n');
  out.write('  --loose-js-modules       Allow named exports when converting to JS modules.\n');
  out.write('  --safe-import-function-identifiers\n');
  out.write('                           Comma-separated list of function names that may safely be in the \n');
  out.write('                           import/require section of the file. All other function calls \n');
  out.write('                           will disqualify later requires from being converted to imports.\n');
  out.write('  --prefer-let             Use let instead of const for most variables in output code.\n');
  out.write('  --loose                  Enable all --loose... options.\n');
  out.write('  --loose-default-params   Convert CS default params to JS default params.\n');
  out.write('  --loose-for-expressions  Do not wrap expression loop targets in Array.from.\n');
  out.write('  --loose-for-of           Do not wrap JS for...of loop targets in Array.from.\n');
  out.write('  --loose-includes         Do not wrap in Array.from when converting in to includes.\n');
  out.write('  --loose-comparison-negation\n');
  out.write('                           Allow unsafe simplifications like `!(a > b)` to `a <= b`.\n');
  out.write('  --disallow-invalid-constructors\n');
  out.write('                           Give an error when constructors use this before super or\n');
  out.write('                           omit the super call in a subclass.\n');
  out.write('  --optional-chaining      Target JavaScript optional chaining. Note the semantics may not\n');
  out.write('                           match exactly.\n');
  out.write('  --logical-assignment     Use the ES2021 logical assignment operators `&&=`, `||=`,\n');
  out.write('                           and `??=`.\n');
  out.write('\n');
  out.write('EXAMPLES\n');
  out.write('\n');
  out.write('  # Convert a .coffee file to a .js file.\n');
  out.write('  $ decaffeinate index.coffee\n');
  out.write('\n');
  out.write('  # Pipe an example from the command-line.\n');
  out.write('  $ echo "a = 1" | decaffeinate\n');
  out.write('\n');
  out.write('  # On macOS this may come in handy:\n');
  out.write('  $ pbpaste | decaffeinate | pbcopy\n');
  out.write('\n');
  out.write('  # Process everything in a directory.\n');
  out.write('  $ decaffeinate src/\n');
  out.write('\n');
  out.write('  # Redirect input from a file.\n');
  out.write('  $ decaffeinate < index.coffee\n');
}

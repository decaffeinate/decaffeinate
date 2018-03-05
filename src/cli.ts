/* eslint-disable no-process-exit */

import { readdir, readFile, stat, writeFile } from 'mz/fs';
import { basename, dirname, extname, join } from 'path';
import { convert, modernizeJS } from './index';
import { Options } from './options';
import PatchError from './utils/PatchError';
const pkg = require('../package');

/**
 * Run the script with the user-supplied arguments.
 */
export default function run(args: Array<string>): void {
  let options = parseArguments(args);

  if (options.paths.length) {
    runWithPaths(options.paths, options);
  } else {
    runWithStdio(options);
  }
}

type CLIOptions = {
  paths: Array<string>,
  baseOptions: Options,
  modernizeJS: boolean,
};

function parseArguments(args: Array<string>): CLIOptions {
  let paths = [];
  let baseOptions: Options = {};
  let modernizeJS = false;

  for (let i = 0; i < args.length; i++) {
    let arg = args[i];
    switch (arg) {
      case '-h':
      case '--help':
        usage();
        process.exit(0);
        break;

      case '-v':
      case '--version':
        version();
        process.exit(0);
        break;

      case '--modernize-js':
        modernizeJS = true;
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

      case '--use-optional-chaining':
        baseOptions.useOptionalChaining = true;
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
        baseOptions.disableBabelConstructorWorkaround = true;
        break;

      case '--disallow-invalid-constructors':
        baseOptions.disallowInvalidConstructors = true;
        break;

      case '--loose':
        baseOptions.looseDefaultParams = true;
        baseOptions.looseForExpressions = true;
        baseOptions.looseForOf = true;
        baseOptions.looseIncludes = true;
        baseOptions.looseComparisonNegation = true;
        baseOptions.looseJSModules = true;
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
        baseOptions.disableBabelConstructorWorkaround = true;
        break;

      default:
        if (arg.startsWith('-')) {
          console.error(`Error: unrecognized option '${arg}'`);
          process.exit(1);
        }
        paths.push(arg);
        break;
    }
  }

  return { paths, baseOptions, modernizeJS };
}

/**
 * Run decaffeinate on the given paths, changing them in place.
 */
function runWithPaths(paths: Array<string>, options: CLIOptions, callback: ((errors: Array<Error>) => void) | null = null): void {
  let errors: Array<Error> = [];
  let pending = paths.slice();

  function processPath(path: string): void {
    stat(path)
      .then(info => {
        if (info.isDirectory()) {
          processDirectory(path);
        } else {
          processFile(path);
        }
      })
      .catch(err => {
        errors.push(err);
      });
  }

  function processDirectory(path: string): void {
    readdir(path)
      .then(children => {
        pending.unshift(
          ...children
            .filter(child => {
              if (options.modernizeJS) {
                return child.endsWith('.js');
              } else {
                return child.endsWith('.coffee') ||
                  child.endsWith('.litcoffee') ||
                  child.endsWith('.coffee.md');
              }
            })
            .map(child => join(path, child))
        );
      })
      .catch(err => {
        errors.push(err);
      })
      .then(() => {
        processNext();
      });
  }

  function processFile(path: string): void {
    let extension = path.endsWith('.coffee.md') ? '.coffee.md' : extname(path);
    let outputPath = join(dirname(path), basename(path, extension)) + '.js';
    console.log(`${path} → ${outputPath}`);
    readFile(path, 'utf8')
      .then(data => {
        let resultCode = runWithCode(path, data, options);
        return writeFile(outputPath, resultCode);
      })
      .catch(err => {
        errors.push(err);
      })
      .then(() => {
        processNext();
      });
  }

  function processNext(): void {
    if (pending.length > 0) {
      let nextPath = pending.shift();
      if (!nextPath) {
        throw new Error('Expected a next path.');
      }
      processPath(nextPath);
    } else if (callback) {
      callback(errors);
    }
  }

  processNext();
}

function runWithStdio(options: CLIOptions): void {
  let data = '';
  process.stdin.on('data', chunk => data += chunk);
  process.stdin.on('end', () => {
    let resultCode = runWithCode('stdin', data, options);
    process.stdout.write(resultCode);
  });
}

/**
 * Run decaffeinate on the given code string and return the resulting code.
 */
function runWithCode(name: string, code: string, options: CLIOptions): string {
  let baseOptions = Object.assign({filename: name}, options.baseOptions);
  try {
    if (options.modernizeJS) {
      return modernizeJS(code, baseOptions).code;
    } else {
      return convert(code, baseOptions).code;
    }
  } catch (err) {
    if (PatchError.detect(err)) {
      console.error(`${name}: ${PatchError.prettyPrint(err)}`);
      process.exit(1);
      throw new Error();
    } else {
      throw err;
    }
  }
}

/**
 * Print version
 */
function version(): void {
  console.log('%s v%s', pkg.name, pkg.version);
}

/**
 * Print usage help.
 */
function usage(): void {
  let exe = basename(process.argv[1]);
  console.log('%s [OPTIONS] PATH [PATH …]', exe);
  console.log('%s [OPTIONS] < INPUT', exe);
  console.log();
  console.log('Move your CoffeeScript source to JavaScript using modern syntax.');
  console.log();
  console.log('OPTIONS');
  console.log();
  console.log('  -h, --help               Display this help message.');
  console.log('  --modernize-js           Treat the input as JavaScript and only run the');
  console.log('                           JavaScript-to-JavaScript transforms, modifying the file(s)');
  console.log('                           in-place.');
  console.log('  --literate               Treat the input file as Literate CoffeeScript.');
  console.log('  --disable-suggestion-comment');
  console.log('                           Do not include a comment with followup suggestions at the');
  console.log('                           top of the output file.');
  console.log('  --no-array-includes      Do not use Array.prototype.includes in generated code.');
  console.log('  --use-optional-chaining  Use the upcoming optional chaining syntax for operators like `?.`.');
  console.log('  --use-js-modules         Convert require and module.exports to import and export.');
  console.log('  --loose-js-modules       Allow named exports when converting to JS modules.');
  console.log('  --safe-import-function-identifiers');
  console.log('                           Comma-separated list of function names that may safely be in the ');
  console.log('                           import/require section of the file. All other function calls ');
  console.log('                           will disqualify later requires from being converted to imports.');
  console.log('  --prefer-let             Use let instead of const for most variables in output code.');
  console.log('  --loose                  Enable all --loose... options.');
  console.log('  --loose-default-params   Convert CS default params to JS default params.');
  console.log('  --loose-for-expressions  Do not wrap expression loop targets in Array.from.');
  console.log('  --loose-for-of           Do not wrap JS for...of loop targets in Array.from.');
  console.log('  --loose-includes         Do not wrap in Array.from when converting in to includes.');
  console.log('  --loose-comparison-negation');
  console.log('                           Allow unsafe simplifications like `!(a > b)` to `a <= b`.');
  console.log('  --disable-babel-constructor-workaround');
  console.log('                           Never include the Babel/TypeScript workaround code to allow');
  console.log('                           this before super in constructors.');
  console.log('  --disallow-invalid-constructors');
  console.log('                           Give an error when constructors use this before super or');
  console.log('                           omit the super call in a subclass.');
  console.log();
  console.log('EXAMPLES');
  console.log();
  console.log('  # Convert a .coffee file to a .js file.');
  console.log('  $ decaffeinate index.coffee');
  console.log();
  console.log('  # Pipe an example from the command-line.');
  console.log('  $ echo "a = 1" | decaffeinate');
  console.log();
  console.log('  # On OS X this may come in handy:');
  console.log('  $ pbpaste | decaffeinate | pbcopy');
  console.log();
  console.log('  # Process everything in a directory.');
  console.log('  $ decaffeinate src/');
  console.log();
  console.log('  # Redirect input from a file.');
  console.log('  $ decaffeinate < index.coffee');
}

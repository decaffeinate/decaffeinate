import { createReadStream, createWriteStream, renameSync } from 'fs';
import { basename } from 'path';
import { convert } from './index';

/**
 * Run the script with the user-supplied arguments.
 *
 * @param {string[]} args
 */
export default function run(args) {
  const input = parseArguments(args);

  if (input.paths.length) {
    runWithPaths(input.paths, input.options);
  } else {
    runWithStream(process.stdin, process.stdout, input.options);
  }
}

/**
 * @param {string[]} args
 * @returns {{options: ConvertOptions, paths: string[]}}
 */
function parseArguments(args) {
  const options = /** @type ConvertOptions */{};
  const paths = /** @type string[] */[];

  for (var i = 0; i < args.length; i++) {
    var arg = args[i];
    switch (arg) {
      case '--call-parens':
      case '--no-call-parens':
        options.callParens = (arg === '--call-parens');
        break;

      case '--commas':
      case '--no-commas':
        options.commas = (arg === '--commas');
        break;

      case '--declarations':
      case '--no-declarations':
        options.declarations = (arg === '--declarations');
        break;

      case '--function-parens':
      case '--no-function-parens':
        options.functionParens = (arg === '--function-parens');
        break;

      case '-h':
      case '--help':
        usage();
        process.exit(0);
        break;

      case '--interpolation':
      case '--no-interpolation':
        options.stringInterpolation = (arg === '--interpolation');
        break;

      case '--keywords':
      case '--no-keywords':
        options.keywords = (arg === '--keywords');
        break;

      case '--prototype-access':
      case '--no-prototype-access':
        options.prototypeAccess = (arg === '--prototype-access');
        break;

      case '--returns':
      case '--no-returns':
        options.returns = (arg === '--returns');
        break;

      case '--this':
      case '--no-this':
        options.this = (arg === '--this');
        break;

      default:
        paths.push(arg);
        break;
    }
  }

  return { options: options, paths: paths };
}

/**
 * Run decaffeinate on the given paths, changing them in place.
 *
 * @param {string[]} paths
 * @param {ConvertOptions=} options
 * @param {?function(Error[])=} callback
 */
function runWithPaths(paths, options, callback) {
  const errors = [];
  var index = 0;

  function processPath(path) {
    const temporaryPath = path + '.decaffeinate';
    runWithStream(
      createReadStream(path, 'utf8'),
      createWriteStream(temporaryPath, 'utf8'),
      options,
      function(err) {
        if (err) {
          errors.push(err);
        } else {
          renameSync(temporaryPath, path);
        }
        processNext();
      }
    );
  }

  function processNext() {
    if (index < paths.length) {
      processPath(paths[index++]);
    } else if (callback) {
      callback(errors);
    }
  }

  processNext();
}

/**
 * Run decaffeinate reading from input and writing to corresponding output.
 *
 * @param {ReadableStream} input
 * @param {WritableStream} output
 * @param {ConvertOptions=} options
 * @param {function(?Error)=} callback
 */
function runWithStream(input, output, options, callback) {
  var error;
  var data = '';

  input.setEncoding('utf8');

  input.on('data', function(chunk) {
    data += chunk;
  });

  input.on('end', function() {
    output.end(convert(data, options), function() {
      if (callback) {
        callback(error);
      }
    });
  });

  output.on('error', function(err) {
    error = err;
  });
}

/**
 * Print usage help.
 */
function usage() {
  const exe = basename(process.argv[1]);
  console.log('%s [OPTIONS] PATH [PATH …]', exe);
  console.log('%s [OPTIONS] < INPUT', exe);
  console.log();
  console.log('Move your CoffeeScript source to JavaScript using ES6 syntax.');
  console.log();
  console.log('OPTIONS');
  console.log();
  console.log('  --[no-]call-parens      Add missing parentheses on function calls.');
  console.log('  --[no-]commas           Add missing commas in array, object, and function param lists.');
  console.log('  --[no-]declarations     Add declarations for variable assignments.');
  console.log('  --[no-]function-parens  Surround functions with parentheses.');
  console.log('  --[no-]interpolation    Change string interpolations to template strings.');
  console.log('  --[no-]keywords         Rename keywords from from to their JavaScript equivalents.');
  console.log('  --[no-]prototype-access Change shorthand prototype access to longhand (e.g. `A::b`).');
  console.log('  --[no-]returns          Add a `return` before implicit returns in block functions.');
  console.log('  --[no-]this             Change shorthand `this`, i.e. `@`, to longhand `this`.');
  console.log();
  console.log('EXAMPLES');
  console.log();
  console.log('  # Pipe an example from the command-line.');
  console.log('  $ echo "a = 1" | decaffeinate');
  console.log();
  console.log('  # Redirect input from a file.');
  console.log('  $ decaffeinate < index.coffee');
  console.log();
  console.log('  # Prevent modifying `this`.');
  console.log('  $ echo "a = @a" | decaffeinate --no-this');
}

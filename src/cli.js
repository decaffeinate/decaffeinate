import { createReadStream, createWriteStream, renameSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { convert } from './index';

/**
 * Run the script with the user-supplied arguments.
 *
 * @param {string[]} args
 */
export default function run(args) {
  const input = parseArguments(args);

  if (input.paths.length) {
    runWithPaths(input.paths);
  } else {
    runWithStream(process.stdin, process.stdout);
  }
}

/**
 * @param {string[]} args
 * @returns {{paths: string[]}}
 */
function parseArguments(args) {
  const paths = /** @type string[] */[];

  for (var i = 0; i < args.length; i++) {
    var arg = args[i];
    switch (arg) {
      case '-h':
      case '--help':
        usage();
        process.exit(0);
        break;

      default:
        paths.push(arg);
        break;
    }
  }

  return { paths };
}

/**
 * Run decaffeinate on the given paths, changing them in place.
 *
 * @param {string[]} paths
 * @param {?function(Error[])=} callback
 */
function runWithPaths(paths, callback) {
  const errors = [];
  var index = 0;

  function processPath(path) {
    const outputPath = join(dirname(path), basename(path, extname(path))) + '.js';
    runWithStream(
      createReadStream(path, { encoding: 'utf8' }),
      createWriteStream(outputPath, { encoding: 'utf8' }),
      function(err) {
        if (err) { errors.push(err); }
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
 * @param {function(?Error)=} callback
 */
function runWithStream(input, output, callback) {
  var error;
  var data = '';

  input.setEncoding('utf8');

  input.on('data', function(chunk) {
    data += chunk;
  });

  input.on('end', function() {
    output.end(convert(data), function() {
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
  console.log('  -h, --help  Display this help message.');
  console.log();
  console.log('EXAMPLES');
  console.log();
  console.log('  # Convert a .coffee file to a .js file.');
  console.log('  $ decaffeinate index.coffee');
  console.log();
  console.log('  # Pipe an example from the command-line.');
  console.log('  $ echo "a = 1" | decaffeinate');
  console.log();
  console.log('  # Redirect input from a file.');
  console.log('  $ decaffeinate < index.coffee');
}

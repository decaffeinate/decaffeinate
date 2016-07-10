/* @flow */
/* eslint-disable no-process-exit */

import PatchError from './utils/PatchError.js';
import type { Readable, Writable } from 'stream';
import type { WriteStream } from 'tty';
import { convert } from './index.js';
import { join, dirname, basename, extname } from 'path';
import { stat, readdir, createReadStream, createWriteStream } from 'fs';

/**
 * Run the script with the user-supplied arguments.
 */
export default function run(args: Array<string>) {
  let options = parseArguments(args);

  if (options.paths.length) {
    runWithPaths(options.paths);
  } else {
    runWithStream('stdin', process.stdin, process.stdout);
  }
}

type Options = {
  paths: Array<string>
};

function parseArguments(args: Array<string>): Options {
  let paths = [];

  for (let i = 0; i < args.length; i++) {
    let arg = args[i];
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
 */
function runWithPaths(paths: Array<string>, callback: ?((errors: Array<Error>) => void)=null) {
  let errors = [];
  let pending = paths.slice();

  function processPath(path: string) {
    stat(path, (err, info) => {
      if (err) { errors.push(err); }
      else if (info.isDirectory()) {
        processDirectory(path);
      } else {
        processFile(path);
      }
    });
  }

  function processDirectory(path: string) {
    readdir(path, (err, children) => {
      if (err) { errors.push(err); }
      else {
        pending.unshift(
          ...children
            .filter(child => extname(child) === '.coffee')
            .map(child => join(path, child))
        );
      }
      processNext();
    });
  }

  function processFile(path: string) {
    let outputPath = join(dirname(path), basename(path, extname(path))) + '.js';
    console.log(`${path} → ${outputPath}`);
    runWithStream(
      path,
      createReadStream(path, { encoding: 'utf8' }),
      createWriteStream(outputPath, { encoding: 'utf8' }),
      err => {
        if (err) { errors.push(err); }
        processNext();
      }
    );
  }

  function processNext() {
    if (pending.length > 0) {
      processPath(pending.shift());
    } else if (callback) {
      callback(errors);
    }
  }

  processNext();
}

/**
 * Run decaffeinate reading from input and writing to corresponding output.
 */
function runWithStream(name: string, input: Readable, output: Writable | WriteStream, callback: ?((error?: ?Error) => void) = null) {
  let error = null;
  let data = '';

  input.setEncoding('utf8');

  input.on('data', chunk => data += chunk);

  input.on('end', () => {
    let converted;
    try {
      converted = convert(data);
    } catch (err) {
      if (PatchError.detect(err)) {
        console.error(`${name}: ${PatchError.prettyPrint(err)}`);
        process.exit(1);
      } else {
        throw err;
      }
    }
    if (converted) {
      let { code } = converted;
      output.end(code, () => {
        if (callback) {
          callback(error);
        }
      });
    }
  });

  output.on('error', err => error = err);
}

/**
 * Print usage help.
 */
function usage() {
  let exe = basename(process.argv[1]);
  console.log('%s [OPTIONS] PATH [PATH …]', exe);
  console.log('%s [OPTIONS] < INPUT', exe);
  console.log();
  console.log('Move your CoffeeScript source to JavaScript using modern syntax.');
  console.log();
  console.log('OPTIONS');
  console.log();
  console.log('  -h, --help     Display this help message.');
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

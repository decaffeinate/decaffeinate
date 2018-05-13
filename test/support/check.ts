import { strictEqual } from 'assert';
import { convert } from '../../src/index';
import { Options } from '../../src/options';
import PatchError from '../../src/utils/PatchError';
import stripSharedIndent from '../../src/utils/stripSharedIndent';

export type Extra = {
  options?: Options;
  shouldStripIndent?: boolean;
};

export default function check(
  source: string,
  expected: string,
  { options = {}, shouldStripIndent = true }: Extra = {}
): void {
  ({ source, expected } = maybeStripIndent(shouldStripIndent, source, expected));
  checkOutput(source, expected, { ...options, useCS2: false });
  checkOutput(source, expected, { ...options, useCS2: true });
}

export function checkCS1(
  source: string,
  expected: string,
  { options = {}, shouldStripIndent = true }: Extra = {}
): void {
  ({ source, expected } = maybeStripIndent(shouldStripIndent, source, expected));
  checkOutput(source, expected, { ...options, useCS2: false });
}

export function checkCS2(
  source: string,
  expected: string,
  { options = {}, shouldStripIndent = true }: Extra = {}
): void {
  ({ source, expected } = maybeStripIndent(shouldStripIndent, source, expected));
  checkOutput(source, expected, { ...options, useCS2: true });
}

function maybeStripIndent(
  shouldStripIndent: boolean,
  source: string,
  expected: string
): { source: string; expected: string } {
  if (shouldStripIndent) {
    if (source[0] === '\n') {
      source = stripSharedIndent(source);
    }
    if (expected[0] === '\n') {
      expected = stripSharedIndent(expected);
    }
  }
  return { source, expected };
}

function checkOutput(source: string, expected: string, options: Options): void {
  try {
    let converted = convert(source, {
      disableSuggestionComment: true,
      ...options
    });
    let actual = converted.code;
    if (actual.endsWith('\n') && !expected.endsWith('\n')) {
      actual = actual.substr(0, actual.length - 1);
    }
    strictEqual(actual, expected);
  } catch (err) {
    if (PatchError.detect(err)) {
      console.error(PatchError.prettyPrint(err));
    }
    throw err;
  }
}

/* @flow */

import { IDENTIFIER } from 'coffee-lex';
import { parse } from 'decaffeinate-parser';
import stripSharedIndent from './stripSharedIndent.js';

let verified = false;

export default function verifyCoffeeLexLoadedOnce() {
  if (verified) {
    return;
  }
  let sourceTokenList = parse('a').context.sourceTokens;
  let firstIndex = sourceTokenList.indexOfTokenContainingSourceIndex(0);
  let token = sourceTokenList.tokenAtIndex(firstIndex);
  if (token.type !== IDENTIFIER) {
    throw new Error(stripSharedIndent(`
      decaffeinate and decaffeinate-parser appear to be using different
      instances of coffee-lex. coffee-lex uses singleton token types that must
      be identity-equal, so the same copy must be used everywhere. Note that
      this means that "npm link" does not work to test decaffeinate against an
      unreleased version of decaffeinate-parser; you must build a
      decaffeinate-parser package by setting a version and using "npm pack",
      then install it for decaffeinate using "npm install".
    `));
  }
  verified = true;
}

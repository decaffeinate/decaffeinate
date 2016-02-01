#!/usr/bin/env node -r babel-register

import { makePatcher } from './index';
import MagicString from 'magic-string';
import { parse } from 'decaffeinate-parser';

let { stdin } = process;
let input = '';

stdin.on('data', chunk => input += chunk);
stdin.on('end', () => {
  let magicString = new MagicString(input);
  let ast = parse(input);
  console.log(ast.context.tokens);
  let patcher = makePatcher(ast, ast.context, magicString);

  patcher.patch();
  console.log(magicString.toString());
});


import MagicString from 'magic-string';
import MainStage from '../../src/stages/main/index.js';
import PatchError from '../../src/utils/PatchError.js';
import parse from '../../src/utils/parse.js';
import stripSharedIndent from '../../src/utils/stripSharedIndent.js';
import type ProgramPatcher from '../../src/stages/main/patchers/ProgramPatcher.js';
import { convert } from '../../dist/decaffeinate.cjs.js';
import { strictEqual } from 'assert';

export default function check(source, expected) {
  try {
    let converted = convert(stripSharedIndent(source));
    strictEqual(converted.code, stripSharedIndent(expected));
  } catch (err) {
    if (PatchError.isA(err)) {
      console.error(PatchError.prettyPrint(err));
    }
    throw err;
  }
}

type UnitTestConfig = {
  source: string,
  equals: string,
  after: (program: ProgramPatcher) => void
};

export function unit(config: UnitTestConfig) {
  let { source, equals, after } = config;
  source = stripSharedIndent(source);
  equals = stripSharedIndent(equals);
  let editor = new MagicString(source);
  let ast = parse(source);
  let stage = new MainStage(ast, ast.context, editor);
  stage.build();
  after(stage.root);
  strictEqual(editor.toString(), equals);
}

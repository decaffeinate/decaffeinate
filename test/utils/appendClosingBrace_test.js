import MagicString from 'magic-string';
import appendClosingBrace from '../../src/utils/appendClosingBrace.js';
import parse from '../../src/utils/parse.js';
import { strictEqual } from 'assert';

describe('appendClosingBrace', () => {
  it('appends a closing brace on the line following the node', () => {
    let source = 'class A\n  b: null';
    let node = parse(source).body.statements[0];
    let patcher = new MagicString(source);
    appendClosingBrace(node, patcher);
    strictEqual(patcher.toString(), 'class A\n  b: null\n}');
  });

  it('appends a closing brace indented by the same amount as the node start', () => {
    let source = '->\n  class A\n    b: null';
    let node = parse(source).body.statements[0].body.statements[0];
    let patcher = new MagicString(source);
    appendClosingBrace(node, patcher);
    strictEqual(patcher.toString(), '->\n  class A\n    b: null\n  }');
  });

  it('appends a closing brace before any comments following the node on subsequent lines', () => {
    let source = 'class A\n  b: null\n\n# HEY\na';
    let node = parse(source).body.statements[0];
    let patcher = new MagicString(source);
    appendClosingBrace(node, patcher);
    strictEqual(patcher.toString(), 'class A\n  b: null\n}\n\n# HEY\na');
  });

  it('appends a closing brace after any comments following the node on the same line', () => {
    let source = 'class A\n  b: null  # HEY\na';
    let node = parse(source).body.statements[0];
    let patcher = new MagicString(source);
    appendClosingBrace(node, patcher);
    strictEqual(patcher.toString(), 'class A\n  b: null  # HEY\n}\na');
  });

  it('appends a closing brace without a newline if the thing to append after is on one line', () => {
    let source = 'try a catch err';
    let node = parse(source).body.statements[0];
    let patcher = new MagicString(source);
    appendClosingBrace(node, patcher);
    strictEqual(patcher.toString(), 'try a catch err}');
  });
});

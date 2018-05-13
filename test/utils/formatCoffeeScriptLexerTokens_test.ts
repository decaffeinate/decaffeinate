import { strictEqual } from 'assert';
import { tokens } from 'decaffeinate-coffeescript2';
import CodeContext from '../../src/utils/CodeContext';
import formatCoffeeScriptLexerTokens from '../../src/utils/formatCoffeeScriptLexerTokens';
import stripSharedIndent from '../../src/utils/stripSharedIndent';

describe('formatCoffeeScriptLexerTokens', () => {
  it('formats tokens for normal CoffeeScript code', () => {
    let source = stripSharedIndent(`
      x = for a in b
        a()
    `);
    let formattedTokens = formatCoffeeScriptLexerTokens(tokens(source), new CodeContext(source));
    strictEqual(
      formattedTokens,
      stripSharedIndent(`
      [1:1(0)-1:2(1)]: IDENTIFIER: "x"
      [1:3(2)-1:4(3)]: =: "="
      [1:5(4)-1:8(7)]: FOR: "for"
      [1:9(8)-1:10(9)]: IDENTIFIER: "a"
      [1:11(10)-1:13(12)]: FORIN: "in"
      [1:14(13)-1:15(14)]: IDENTIFIER: "b"
      [2:1(15)-2:3(17)]: INDENT: 2
      [2:3(17)-2:4(18)]: IDENTIFIER: "a"
      [2:4(18)-2:5(19)]: CALL_START: "("
      [2:5(19)-2:6(20)]: CALL_END: ")"
      [2:5(19)-2:6(20)]: OUTDENT: 2
      [2:6(20)-2:6(20)]: TERMINATOR: "\\n"
    `) + '\n'
    );
  });
});

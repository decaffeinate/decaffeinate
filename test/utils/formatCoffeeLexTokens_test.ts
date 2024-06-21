import { strictEqual } from 'assert';
import { lex } from 'coffee-lex';
import CodeContext from '../../src/utils/CodeContext';
import formatCoffeeLexTokens from '../../src/utils/formatCoffeeLexTokens';
import stripSharedIndent from '../../src/utils/stripSharedIndent';

describe('formatCoffeeLexTokens', () => {
  it('formats tokens for normal CoffeeScript code', () => {
    const source = stripSharedIndent(`
      x = for a in b
        a()
    `);
    const tokenList = lex(source);
    const formattedTokens = formatCoffeeLexTokens(tokenList, new CodeContext(source));
    strictEqual(
      formattedTokens,
      stripSharedIndent(`
      [1:1(0)-1:2(1)]: IDENTIFIER
      [1:3(2)-1:4(3)]: OPERATOR
      [1:5(4)-1:8(7)]: FOR
      [1:9(8)-1:10(9)]: IDENTIFIER
      [1:11(10)-1:13(12)]: RELATION
      [1:14(13)-1:15(14)]: IDENTIFIER
      [1:15(14)-2:1(15)]: NEWLINE
      [2:3(17)-2:4(18)]: IDENTIFIER
      [2:4(18)-2:5(19)]: CALL_START
      [2:5(19)-2:6(20)]: CALL_END
    `) + '\n',
    );
  });
});

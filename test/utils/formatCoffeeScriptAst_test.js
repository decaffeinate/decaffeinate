import { strictEqual } from 'assert';
import formatCoffeeScriptAst from '../../src/utils/formatCoffeeScriptAst';
import stripSharedIndent from '../../src/utils/stripSharedIndent';
import parse from '../../src/utils/parse';

describe('formatCoffeeScriptAst', () => {
  it('formats an AST for normal CoffeeScript code', () => {
    let source = stripSharedIndent(`
      x = a()
    `);
    let context = parse(source).context;
    let formattedTokens = formatCoffeeScriptAst(context);
    strictEqual(formattedTokens, stripSharedIndent(`
      Block [1:1(0)-1:8(7)] {
        expressions: [
          Assign [1:1(0)-1:8(7)] {
            context: undefined
            param: undefined
            subpattern: undefined
            operatorToken: undefined
            variable: Value [1:1(0)-1:2(1)] {
              base: Literal [1:1(0)-1:2(1)] {
                value: "x"
              }
              properties: []
            }
            value: Call [1:5(4)-1:8(7)] {
              soak: false
              isNew: false
              isSuper: false
              args: []
              variable: Value [1:5(4)-1:6(5)] {
                base: Literal [1:5(4)-1:6(5)] {
                  value: "a"
                }
                properties: []
              }
            }
          }
        ]
      }
    `) + '\n');
  });
});

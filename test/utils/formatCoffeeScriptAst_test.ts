import { strictEqual } from 'assert';
import formatCoffeeScriptAst from '../../src/utils/formatCoffeeScriptAst';
import parse from '../../src/utils/parse';
import stripSharedIndent from '../../src/utils/stripSharedIndent';

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

  it('properly formats switch statements', () => {
    let source = stripSharedIndent(`
      switch
        when 1
          2
    `);
    let context = parse(source).context;
    let formattedTokens = formatCoffeeScriptAst(context);
    strictEqual(formattedTokens, stripSharedIndent(`
      Block [1:1(0)-3:6(21)] {
        expressions: [
          Switch [1:1(0)-3:6(21)] {
            subject: null
            otherwise: undefined
            cases: [
              [
                Value [2:8(14)-2:9(15)] {
                  base: Literal [2:8(14)-2:9(15)] {
                    value: "1"
                  }
                  properties: []
                }
                Block [3:5(20)-3:6(21)] {
                  expressions: [
                    Value [3:5(20)-3:6(21)] {
                      base: Literal [3:5(20)-3:6(21)] {
                        value: "2"
                      }
                      properties: []
                    }
                  ]
                }
              ]
            ]
          }
        ]
      }
    `) + '\n');
  });
});

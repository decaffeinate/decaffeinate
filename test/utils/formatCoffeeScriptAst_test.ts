import { strictEqual } from 'assert';
import {nodes} from 'decaffeinate-coffeescript';
import CodeContext from '../../src/utils/CodeContext';
import formatCoffeeScriptAst from '../../src/utils/formatCoffeeScriptAst';
import stripSharedIndent from '../../src/utils/stripSharedIndent';

describe('formatCoffeeScriptAst', () => {
  it('formats an AST for normal CoffeeScript code', () => {
    let source = stripSharedIndent(`
      x = a()
    `);
    let formattedTokens = formatCoffeeScriptAst(nodes(source), new CodeContext(source));
    strictEqual(formattedTokens, stripSharedIndent(`
      Block [1:1(0)-1:8(7)] {
        expressions: [
          Assign [1:1(0)-1:8(7)] {
            context: undefined
            param: undefined
            subpattern: undefined
            operatorToken: undefined
            moduleDeclaration: undefined
            variable: Value [1:1(0)-1:2(1)] {
              base: IdentifierLiteral [1:1(0)-1:2(1)] {
                value: "x"
              }
              properties: []
            }
            value: Call [1:5(4)-1:8(7)] {
              soak: false
              isNew: false
              variable: Value [1:5(4)-1:6(5)] {
                base: IdentifierLiteral [1:5(4)-1:6(5)] {
                  value: "a"
                }
                properties: []
              }
              args: []
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
    let formattedTokens = formatCoffeeScriptAst(nodes(source), new CodeContext(source));
    strictEqual(formattedTokens, stripSharedIndent(`
      Block [1:1(0)-3:6(21)] {
        expressions: [
          Switch [1:1(0)-3:6(21)] {
            subject: null
            otherwise: undefined
            cases: [
              [
                Value [2:8(14)-2:9(15)] {
                  base: NumberLiteral [2:8(14)-2:9(15)] {
                    value: "1"
                  }
                  properties: []
                }
                Block [3:5(20)-3:6(21)] {
                  expressions: [
                    Value [3:5(20)-3:6(21)] {
                      base: NumberLiteral [3:5(20)-3:6(21)] {
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

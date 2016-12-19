import { strictEqual } from 'assert';
import formatDecaffeinateParserAst from '../../src/utils/formatDecaffeinateParserAst';
import stripSharedIndent from '../../src/utils/stripSharedIndent';
import parse from '../../src/utils/parse';

describe('formatDecaffeinateParserAst', () => {
  it('formats an AST for normal CoffeeScript code', () => {
    let source = stripSharedIndent(`
      loop
        x = a()
        break
    `);
    let ast = parse(source);
    let formattedTokens = formatDecaffeinateParserAst(ast);
    strictEqual(formattedTokens, stripSharedIndent(`
      Program [1:1(0)-3:8(22)] {
        body: Block [1:1(0)-3:8(22)] {
          statements: [
            While [1:1(0)-3:8(22)] {
              isUntil: false
              condition: Bool (virtual) {
                data: true
              }
              guard: null
              body: Block [2:3(7)-3:8(22)] {
                inline: false
                statements: [
                  AssignOp [2:3(7)-2:10(14)] {
                    assignee: Identifier [2:3(7)-2:4(8)] {
                      data: "x"
                    }
                    expression: FunctionApplication [2:7(11)-2:10(14)] {
                      function: Identifier [2:7(11)-2:8(12)] {
                        data: "a"
                      }
                      arguments: []
                    }
                  }
                  Identifier [3:3(17)-3:8(22)] {
                    data: "break"
                  }
                ]
              }
            }
          ]
        }
      }
    `) + '\n');
  });
});

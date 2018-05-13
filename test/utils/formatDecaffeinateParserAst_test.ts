import { strictEqual } from 'assert';
import { parse } from 'decaffeinate-parser';
import CodeContext from '../../src/utils/CodeContext';
import formatDecaffeinateParserAst from '../../src/utils/formatDecaffeinateParserAst';
import stripSharedIndent from '../../src/utils/stripSharedIndent';

describe('formatDecaffeinateParserAst', () => {
  it('formats an AST for normal CoffeeScript code', () => {
    let source = stripSharedIndent(`
      loop
        x = a()
        break
    `);
    let formattedTokens = formatDecaffeinateParserAst(parse(source), new CodeContext(source));
    strictEqual(
      formattedTokens,
      stripSharedIndent(`
      Program [1:1(0)-3:8(22)] {
        body: Block [1:1(0)-3:8(22)] {
          inline: false
          statements: [
            Loop [1:1(0)-3:8(22)] {
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
                  Break [3:3(17)-3:8(22)] {
                  }
                ]
              }
            }
          ]
        }
      }
    `) + '\n'
    );
  });
});

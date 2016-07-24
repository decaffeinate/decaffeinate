import { strictEqual } from 'assert';
import formatDecaffeinateParserAst from '../../src/utils/formatDecaffeinateParserAst.js';
import stripSharedIndent from '../../src/utils/stripSharedIndent.js';
import parse from '../../src/utils/parse.js';

describe('formatDecaffeinateParserAst', () => {
  it('formats an AST for normal CoffeeScript code', () => {
    let source = stripSharedIndent(`
      x = a()
    `);
    let ast = parse(source);
    let formattedTokens = formatDecaffeinateParserAst(ast);
    strictEqual(formattedTokens, stripSharedIndent(`
      Program [1:1(0)-1:8(7)] {
        body: Block [1:1(0)-1:8(7)] {
          statements: [
            AssignOp [1:1(0)-1:8(7)] {
              assignee: Identifier [1:1(0)-1:2(1)] {
                data: "x"
              }
              expression: FunctionApplication [1:5(4)-1:8(7)] {
                function: Identifier [1:5(4)-1:6(5)] {
                  data: "a"
                }
                arguments: []
              }
            }
          ]
        }
      }
    `) + '\n');
  });
});

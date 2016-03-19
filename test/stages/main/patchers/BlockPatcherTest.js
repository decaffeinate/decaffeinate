import type ProgramPatcher from '../../../../src/stages/main/patchers/ProgramPatcher.js';
import { unit } from '../../../support/check.js';

describe('BlockPatcher', () => {
  describe('#insertStatementsAtIndex', () => {
    it('can insert at index 0 before existing statements', () =>
      unit({
        source: `
          a
          b
        `,
        equals: `
          0
          1
          a
          b
        `,
        after(program: ProgramPatcher) {
          program.body.insertStatementsAtIndex(['0', '1'], 0);
        }
      })
    );

    it('can insert in the middle of existing statements', () =>
      unit({
        source: `
          a
          b
        `,
        equals: `
          a
          0
          1
          b
        `,
        after(program: ProgramPatcher) {
          program.body.insertStatementsAtIndex(['0', '1'], 1);
        }
      })
    );

    it('can insert at the end of existing statements', () =>
      unit({
        source: `
          a
          b
        `,
        equals: `
          a
          b
          0
          1
        `,
        after(program: ProgramPatcher) {
          program.body.insertStatementsAtIndex(['0', '1'], 2);
        }
      })
    );

    it('can insert into an indented block', () =>
      unit({
        source: `
          ->
            a
            b
        `,
        equals: `
          ->
            a
            0
            1
            b
        `,
        after(program: ProgramPatcher) {
          program.body.statements[0].body.insertStatementsAtIndex(['0', '1'], 1);
        }
      })
    );

    it('can insert at the beginning of an inline block', () =>
      unit({
        source: `
          -> a; b
        `,
        equals: `
          -> 0; 1; a; b
        `,
        after(program: ProgramPatcher) {
          program.body.statements[0].body.insertStatementsAtIndex(['0', '1'], 0);
        }
      })
    );

    it('can insert in the middle of an inline block', () =>
      unit({
        source: `
          -> a; b
        `,
        equals: `
          -> a; 0; 1; b
        `,
        after(program: ProgramPatcher) {
          program.body.statements[0].body.insertStatementsAtIndex(['0', '1'], 1);
        }
      })
    );

    it('can insert at the end of an inline block', () =>
      unit({
        source: `
          -> a; b
        `,
        equals: `
          -> a; b; 0; 1
        `,
        after(program: ProgramPatcher) {
          program.body.statements[0].body.insertStatementsAtIndex(['0', '1'], 2);
        }
      })
    );
  });
});

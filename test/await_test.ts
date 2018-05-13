import { checkCS2 } from './support/check';

describe('await', () => {
  it('handles basic async function transformation', () => {
    checkCS2(
      `
      f = ->
        await @g()
    `,
      `
      const f = async function() {
        return await this.g();
      };
    `
    );
  });

  it('handles bound async function transformation', () => {
    checkCS2(
      `
      f = =>
        await g()
    `,
      `
      const f = async () => {
        return await g();
      };
    `
    );
  });

  it('handles await return', () => {
    checkCS2(
      `
      f = ->
        await return 3
    `,
      `
      const f = async () => 3;
    `
    );
  });

  it('handles nested await', () => {
    checkCS2(
      `
      f = ->
        x = for a in b
          await c
    `,
      `
      const f = async function() {
        let x;
        return x = await (async () => {
          const result = [];
          for (let a of Array.from(b)) {
            result.push(await c);
          }
          return result;
        })();
      };
    `
    );
  });

  it('handles await within an object method', () => {
    checkCS2(
      `
      o = {
        f: ->
          await 3
      }
    `,
      `
      const o = {
        async f() {
          return await 3;
        }
      };
    `
    );
  });

  it('handles await within a class method', () => {
    checkCS2(
      `
      class C
        f: ->
          await 3
    `,
      `
      class C {
        async f() {
          return await 3;
        }
      }
    `
    );
  });
});

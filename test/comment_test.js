import check from './support/check';

describe('comments', () => {
  it('converts line comments to // form', () => {
    check(`
      # foo
      1
    `, `
      // foo
      1;
    `);
  });

  it('converts block comments to /* */', () => {
    check(`
      ###
      HEY
      ###
      1
    `, `
      /*
      HEY
      */
      1;
    `);
  });

  it('turns leading hashes on block comment lines to leading asterisks', () => {
    check(`
      ###
      # HEY
      ###
      1
    `, `
      /*
       * HEY
       */
      1;
    `);
  });

  it('converts mixed doc block comments to /** */', () => {
    check(`
      ###*
      @param {Buffer} un-hashed
      ###
      (buffer) ->
    `, `
      /**
      @param {Buffer} un-hashed
      */
      (function(buffer) {});
    `);
  });

  it('converts single-line block comments to /* */', () => {
    check(`
      ### HEX ###
      a0
    `, `
      /* HEX */
      a0;
    `);
  });

  it('preserves shebang lines but changes `coffee` to `node`', () => {
    check(`
      #!/usr/bin/env coffee
      console.log "Hello World!"
    `, `
      #!/usr/bin/env node
      console.log("Hello World!");
    `);
  });
});

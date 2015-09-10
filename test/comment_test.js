import check from './support/check';

describe('comments', () => {
  it('converts line comments to // form', function() {
    check(`
      # foo
      1
    `, `
      // foo
      1;
    `);
  });

  it('converts non-doc block comments to /* */', function() {
    check(`
      a(
        ###
        HEY
        ###
        1
      )
    `, `
      a(
        /*
        HEY
        */
        1
      );
    `);
  });

  it('converts doc block comments to /** */', function() {
    check(`
      a(
        ###
        # HEY
        ###
        1
      )
    `, `
      a(
        /**
         * HEY
         */
        1
      );
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

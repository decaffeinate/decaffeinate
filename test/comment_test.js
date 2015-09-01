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
});

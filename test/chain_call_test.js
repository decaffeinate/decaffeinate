import check from './support/check';

describe('functions', () => {
  it('correctly understands multiple chained function calls', () => {
    check(`
      angular
        .module('app')
        .controller('MyCtrl', MyCtrl)
    `, `
      angular
        .module('app')
        .controller('MyCtrl', MyCtrl);
    `);
  });
  it('works with a single function call chain', () => {
    check(`
      angular
        .controller('MyCtrl', MyCtrl)
    `, `
      angular
        .controller('MyCtrl', MyCtrl);
    `);
  });
  it('works with another single function call chain', () => {
    check(`
      angular
        .module('app')
    `, `
      angular
        .module('app');
    `);
  });
});

import validate from './support/validate.js';

function generateTwoLineTests(strings) {
  let output = [];
  for (let line1 of strings) {
    for (let line2 of strings) {
      output.push(line1 + '\n' + line2);
    }
  }
  return output;
}

function generateThreeLineTests(strings) {
  let output = [];
  for (let line1 of strings) {
    for (let line2 of strings) {
      for (let line3 of strings) {
        output.push(line1 + '\n' + line2 + '\n' + line3);
      }
    }
  }
  return output;
}

function runAssignmentTest(quote, string) {
  validate(
`testVariable = "test variable"
o=${quote}${string}${quote}`);
}

function runFunctionTest(quote, string) {
  validate(
`runTest = () ->
  testVariable = "test variable"
  return ${quote}${string}${quote}
output = runTest()`);
}

describe('string integration', function () {
  this.timeout(60000);
  let strings = ['', '   ', 'word', '   leading indent', 'trailing indent   ', 
                 '    leading and trailing indent    '];
  let quotes = [
    ['\'', 'single quote (\')'],
    ['"', 'double quote (\")']];

  let twoLineTests = generateTwoLineTests(strings);
  let threeLineTests = generateThreeLineTests(strings);

  for (let quoteTest of quotes) {
    let [quote, quoteName] = quoteTest;
    it(quoteName + ' two line assignment test (' + twoLineTests.length + ' permutations)', function () {
      for (let string of twoLineTests) {
        runAssignmentTest(quote, string);
      }
    });

    it(quoteName + ' two line function test (' + twoLineTests.length + ' permutations)', function () {
      for (let string of twoLineTests) {
        runFunctionTest(quote, string);
      }
    });

    it(quoteName + ' three line assignment test (' + threeLineTests.length + ' permutations)', function () {
      for (let string of threeLineTests) {
        runAssignmentTest(quote, string);
      }
    });

    it(quoteName + ' three line function test (' + threeLineTests.length + ' permutations)', function () {
      for (let string of threeLineTests) {
        runFunctionTest(quote, string);
      }
    });
  }
});

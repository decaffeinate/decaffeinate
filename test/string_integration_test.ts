import validate from './support/validate';

function generateTwoLineTests(strings: Array<string>): Array<string> {
  const output = [];
  for (const line1 of strings) {
    for (const line2 of strings) {
      output.push(line1 + '\n' + line2);
    }
  }
  return output;
}

function generateThreeLineTests(strings: Array<string>): Array<string> {
  const output = [];
  for (const line1 of strings) {
    for (const line2 of strings) {
      for (const line3 of strings) {
        output.push(`${line1}\n${line2}\n${line3}`);
      }
    }
  }
  return output;
}

function runAssignmentTest(quote: string, string: string): void {
  validate(
    `testVariable = "test variable"
setResult(${quote}${string}${quote})`,
  );
}

function runFunctionTest(quote: string, string: string): void {
  validate(
    `runTest = () ->
  testVariable = "test variable"
  return ${quote}${string}${quote}
setResult(runTest())`,
  );
}

describe('string integration', function (): void {
  const timeout = 180000;
  const strings = ['', '   ', 'word', '   leading indent', 'trailing indent   ', '    leading and trailing indent    '];
  const quotes = [
    ["'", "single quote (')"],
    ['"', 'double quote (")'],
  ];

  const twoLineTests = generateTwoLineTests(strings);
  const threeLineTests = generateThreeLineTests(strings);

  for (const quoteTest of quotes) {
    const [quote, quoteName] = quoteTest;
    it(
      `${quoteName} two line assignment test (${twoLineTests.length} permutations)`,
      () => {
        for (const string of twoLineTests) {
          runAssignmentTest(quote, string);
        }
      },
      timeout,
    );

    it(
      `${quoteName} two line function test (${twoLineTests.length} permutations)`,
      () => {
        for (const string of twoLineTests) {
          runFunctionTest(quote, string);
        }
      },
      timeout,
    );

    it(
      `${quoteName} three line assignment test (${threeLineTests.length} permutations)`,
      () => {
        for (const string of threeLineTests) {
          runAssignmentTest(quote, string);
        }
      },
      timeout,
    );

    it(
      `${quoteName} three line function test (${threeLineTests.length} permutations)`,
      () => {
        for (const string of threeLineTests) {
          runFunctionTest(quote, string);
        }
      },
      timeout,
    );
  }
});

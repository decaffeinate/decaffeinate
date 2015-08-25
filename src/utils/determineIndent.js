/**
 * @param {string} source
 * @returns {string}
 */
export default function determineIndent(source) {
  let minIndent = null;
  let maxIndent = null;
  let tabs = false;

  source.split('\n').forEach(line => {
    const match = line.match(/(\s*)/);
    if (match) {
      let thisIndent = match[1];
      if (thisIndent[0] === '\t') {
        tabs = true;
      }
      if (!minIndent || minIndent.length > thisIndent.length) {
        minIndent = thisIndent;
      }
      if (!maxIndent || maxIndent.length < thisIndent.length) {
        maxIndent = thisIndent;
      }
    }
  });

  if (tabs) {
    return '\t';
  }

  if (!minIndent || minIndent.length < 2) {
    return '  ';
  }

  if (maxIndent.length % minIndent.length !== 0) {
    return '  ';
  }

  return minIndent;
}

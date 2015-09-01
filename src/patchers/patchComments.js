import rangesOfComments from '../utils/rangesOfComments';

/**
 * Replaces CoffeeScript style comments with JavaScript style comments.
 *
 * @param {MagicString} patcher
 */
export default function patchComments(patcher) {
  const source = patcher.original;
  const ranges = rangesOfComments(source);

  ranges.forEach(comment => {
    if (comment.type === 'line') {
      patchLineComment(patcher, comment);
    } else if (comment.type === 'block') {
      patchBlockComment(patcher, comment);
    }
  });
}

/**
 * Patches a single-line comment.
 *
 * @param {MagicString} patcher
 * @param {{start: number, end: number, type: string}} range
 * @private
 */
function patchLineComment(patcher, range) {
  patcher.overwrite(range.start, range.start + '#'.length, '//');
}

/**
 * Patches a single-line comment.
 *
 * @param {MagicString} patcher
 * @param {{start: number, end: number, type: string}} range
 * @private
 */
function patchBlockComment(patcher, range) {
  const { start, end } = range;
  const commentBody = patcher.slice(start, end);
  const comment = parseBlockComment(commentBody);

  if (comment.doc) {
    patcher.overwrite(start, start + comment.head.length, '/**\n');
    let index = start + comment.head.length;
    comment.lines.forEach(line => {
      let indent = line.indexOf('#');
      patcher.overwrite(index + indent, index + indent + '#'.length, ' *');
      index += line.length;
    });
    patcher.overwrite(end - comment.tail.length, end, ' */');
  } else {
    patcher.overwrite(start, start + comment.head.length, '/*\n');
    patcher.overwrite(end - comment.tail.length, end, '*/');
  }
}

/**
 * @param blockComment
 * @returns {{head: string, tail: string, body: string, lines: string[], doc: boolean}}
 * @private
 */
function parseBlockComment(blockComment) {
  const endOfHead = blockComment.indexOf('\n') + 1;
  const lastLineStart = blockComment.lastIndexOf('\n') + 1;
  const startOfTail = blockComment.indexOf('#', lastLineStart);
  const head = blockComment.slice(0, endOfHead);
  const tail = blockComment.slice(startOfTail);
  const body = blockComment.slice(endOfHead, startOfTail);
  const lines = [];

  let newlineIndex = endOfHead - 1;
  while (newlineIndex + 1 < startOfTail) {
    let nextNewlineIndex = blockComment.indexOf('\n', newlineIndex + 1);
    if (nextNewlineIndex < 0) {
      break;
    } else if (nextNewlineIndex > newlineIndex) {
      lines.push(blockComment.slice(newlineIndex + 1, nextNewlineIndex + 1));
    }
    newlineIndex = nextNewlineIndex;
  }

  const doc = lines.every(line => /^ *#/.test(line));

  return { head, tail, body, lines, doc };
}

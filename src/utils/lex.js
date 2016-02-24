export const NORMAL = 1;
export const COMMENT = 2;
export const HERECOMMENT = 3;
export const DSTRING = 4;
export const SSTRING = 5;
export const TDSTRING = 6;
export const TSSTRING = 7;
export const REGEXP = 8;
export const HEREGEXP = 9;
export const EOF = 10;

const REGEXP_FLAGS = ['i', 'g', 'm', 'y'];

/**
 * Provides basic, one-step-at-a-time CoffeeScript lexing. Yeah, I know, this
 * shouldn't exist and we should just use the official CoffeeScript
 * parser/lexer. See https://github.com/eventualbuddha/decaffeinate/issues/65.
 *
 * @param {string} source
 * @param {number=} index
 * @returns {function(): {index: number, state: number, previousState: number}}
 */
export default function lex(source, index=0) {
  let state = NORMAL;
  let interpolationStack = [];
  let braceStack = [];
  return function step() {
    let previousState = state;
    let previousIndex = index;

    if (index >= source.length) {
      setState(EOF);
    }

    switch (state) {
      case NORMAL:
        if (consume('"""')) {
          setState(TDSTRING);
        } else if (consume('"')) {
          setState(DSTRING);
        } else if (consume('\'\'\'')) {
          setState(TSSTRING);
        } else if (consume('\'')) {
          setState(SSTRING);
        } else if (consume('###')) {
          setState(HERECOMMENT);
        } else if (consume('#')) {
          setState(COMMENT);
        } else if (consume('///')) {
          setState(HEREGEXP);
        } else if (consume('{')) {
          braceStack.push(previousIndex);
        } else if (consume('}')) {
          if (braceStack.length === 0) {
            popInterpolation();
          } else {
            braceStack.pop();
          }
        } else if (!hasNext(/^\/=?\s/) && consume('/')) {
          setState(REGEXP);
        } else {
          index++;
        }
        break;

      case SSTRING:
        if (consume('\\')) {
          index++;
        } else if (consume('\'')) {
          setState(NORMAL);
        } else {
          index++;
        }
        break;

      case DSTRING:
        if (consume('\\')) {
          index++;
        } else if (consume('"')) {
          setState(NORMAL);
        } else if (consume('#{')) {
          pushInterpolation();
        } else {
          index++;
        }
        break;

      case COMMENT:
        if (consume('\n') || consume('\r\n') || consume('\r')) {
          setState(NORMAL);
        } else {
          index++;
        }
        break;

      case HERECOMMENT:
        if (consume('###')) {
          setState(NORMAL);
        } else {
          index++;
        }
        break;

      case TSSTRING:
        if (consume('\\')) {
          index++;
        } else if (consume('\'\'\'')) {
          setState(NORMAL);
        } else {
          index++;
        }
        break;

      case TDSTRING:
        if (consume('\\')) {
          index++;
        } else if (consume('"""')) {
          setState(NORMAL);
        } else if (consume('#{')) {
          pushInterpolation();
        } else {
          index++;
        }
        break;

      case REGEXP:
        if (consume('\\')) {
          index++;
        } else if (consume('/')) {
          while (consumeAny(REGEXP_FLAGS));
          setState(NORMAL);
        } else {
          index++;
        }
        break;

      case HEREGEXP:
        if (consume('\\')) {
          index++;
        } else if (consume('///')) {
          while (consumeAny(REGEXP_FLAGS));
          setState(NORMAL);
        } else {
          index++;
        }
        break;

      case EOF:
        if (braceStack.length !== 0) {
          throw new Error(
            `unexpected EOF while looking for '}' to match '{' ` +
            `at ${braceStack[braceStack.length - 1]}`
          );
        }
        break;
    }

    return { index, previousIndex, state, previousState };
  };

  function consumeAny(strings) {
    return strings.some(string => consume(string));
  }

  function consume(string) {
    if (hasNext(string)) {
      index += string.length;
      return true;
    } else {
      return false;
    }
  }

  function setState(newState) {
    state = newState;
  }

  function hasNext(value) {
    if (typeof value === 'string') {
      return source.slice(index, index + value.length) === value;
    } else {
      return value.test(source.slice(index));
    }
  }

  function pushInterpolation() {
    interpolationStack.push(state);
    setState(NORMAL);
  }

  function popInterpolation() {
    if (interpolationStack.length === 0) {
      throw new Error(`unexpected '}' found in string at ${index}: ${JSON.stringify(source)}`);
    }
    setState(interpolationStack.pop());
  }
}

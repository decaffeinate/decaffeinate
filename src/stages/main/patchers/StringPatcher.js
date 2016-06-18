import PassthroughPatcher from './../../../patchers/PassthroughPatcher.js';
import { parseMultilineString } from '../../../utils/parseMultilineString.js';

export default class StringPatcher extends PassthroughPatcher {
  patchAsExpression() {
    if (this.node.raw.indexOf('\n') >= 0) {
        patchMultilineString(this, this.node.raw, this.contentStart);
    }
  }

  patch(options={}) {
    super.patch(options);
    // This is copied from NodePatcher.js, we need functionality from
    // both PassthroughPatcherr and NodePatcher for this patcher to work.
    this.withPrettyErrors(() => {
      if (this.forcedToPatchAsExpression()) {
        this.patchAsForcedExpression(options);
      } else if (this.willPatchAsExpression()) {
        this.patchAsExpression(options);
      } else {
        this.patchAsStatement(options);
      }
    });
  }
}

/* convert a multi line string encosed in single or double quotes (not
 * triple quoted) to es6 ensuring that the string produced will be 
 * identical to the es5 output produced by coffee-script.
 */
function patchMultilineString(patcher, characters, start) {
  let lines = parseMultilineString(characters, start, 1);

  for (let line of lines) {
    if (line.first) {
      if (line.empty == false && line.next.empty == false) {
        patcher.overwrite(line.textEnd + 1, line.end, ' ');
      } else if (line.empty == false && line.next.empty == true) {
        patcher.remove(line.textEnd + 1, line.end);
      } else if (line.empty == true) {
        patcher.remove(line.start, line.end);
      } 
    } else if (line.last) {
      if (line.textStart != null && line.textStart != line.start) {
        patcher.remove(line.start, line.textStart);
      } else if (line.textStart == null && line.textEnd == null && (line.length != 0)) {
        patcher.remove(line.start - 1, line.end);
      }
    } else {
      if (line.empty == false && line.next.empty == false) {
        patcher.overwrite(line.textEnd + 1, line.end, ' ');
        patcher.remove(line.start, line.textStart);
      } else if (line.empty == false && line.next.empty == true) {
        patcher.remove(line.textEnd + 1, line.end);
        patcher.remove(line.start, line.textStart);
      } else if (line.empty == true && line.next.empty == true) {
        patcher.remove(line.start, line.end);
      } else if (line.empty == true && line.next.empty == false) {
        if (line.prev.empty == true) {
          patcher.remove(line.start, line.end);
        } else {
          patcher.overwrite(line.start, line.end, ' ');
        }
      }
    }
  }
}

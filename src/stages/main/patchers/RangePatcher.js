import BinaryOpPatcher from './BinaryOpPatcher';

const RANGE_HELPER =
`function __range__(left, right, inclusive) {
  let range = [];
  let ascending = left < right;
  let end = !inclusive ? right : ascending ? right + 1 : right - 1;
  for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }
  return range;
}`;

const MAXIMUM_LITERAL_RANGE_ELEMENTS = 21;

export default class RangePatcher extends BinaryOpPatcher {
  patchAsExpression() {
    if (this.canBecomeLiteralArray()) {
      this.patchAsLiteralArray();
    } else {
      this.patchAsIIFE();
    }
  }

  /**
   * @private
   */
  patchAsLiteralArray() {
    let start = this.left.node.data;
    let end = this.right.node.data;
    let inclusive = this.isInclusive();
    let ascending = start < end;

    if (inclusive) {
      end += ascending ? 1 : -1;
    }

    let list = '';

    for (let i = start; ascending ? i < end : i > end; ascending ? i++ : i--) {
      let isLast = ascending ? i === end - 1 : i === end + 1;
      if (isLast) {
        list += `${i}`;
      } else {
        list += `${i}, `;
      }
    }

    // `[0..2]` → `[0, 1, 2]`
    //  ^^^^^^     ^^^^^^^^^
    this.overwrite(this.contentStart, this.contentEnd, `[${list}]`);
  }

  /**
   * @private
   */
  patchAsIIFE() {
    let helper = this.registerHelper('__range__', RANGE_HELPER);

    // `[a..b]` → `__range__(a..b]`
    //  ^          ^^^^^^^^^^
    this.overwrite(this.contentStart, this.left.outerStart, `${helper}(`);

    this.left.patch();

    // `__range__(a..b]` → `__range__(a, b]`
    //             ^^                  ^^
    this.overwrite(this.left.outerEnd, this.right.outerStart, ', ');

    this.right.patch();

    // `__range__(a, b]` → `__range__(a, b, true)`
    //                ^                   ^^^^^^
    this.overwrite(this.right.outerEnd, this.contentEnd, `, ${this.isInclusive()})`);
  }

  /**
   * @private
   */
  canBecomeLiteralArray(): boolean {
    let range = this.getLiteralRange();

    if (!range) {
      return false;
    }

    let [ first, last ] = range;
    return Math.abs(last - first) <= MAXIMUM_LITERAL_RANGE_ELEMENTS;
  }

  /**
   * @private
   */
  getLiteralRange(): ?[number, number] {
    let left = this.left.node;
    let right = this.right.node;

    if (left.type !== 'Int' || right.type !== 'Int') {
      return false;
    }

    let first = left.data;
    let last = right.data;
    if (first < last) {
      return [first, last + (this.isInclusive() ? 1 : 0)];
    } else {
      return [first, last - (this.isInclusive() ? 1 : 0)];
    }
  }

  /**
   * @private
   */
  isInclusive(): boolean {
    return this.node.isInclusive;
  }
}

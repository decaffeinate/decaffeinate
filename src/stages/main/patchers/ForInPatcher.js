import ArrayInitialiserPatcher from './ArrayInitialiserPatcher';
import ForPatcher from './ForPatcher';
import RangePatcher from './RangePatcher';
import isObjectInitialiserBlock from '../../../utils/isObjectInitialiserBlock';
import type BlockPatcher from './BlockPatcher';
import type NodePatcher from './../../../patchers/NodePatcher';
import type { PatcherContext } from './../../../patchers/types';

const UP = 'UP';
const DOWN = 'DOWN';
const UNKNOWN = 'UNKNOWN';
type IndexDirection = 'UP' | 'DOWN' | 'UNKNOWN';

export default class ForInPatcher extends ForPatcher {
  constructor(patcherContext: PatcherContext, keyAssignee: ?NodePatcher, valAssignee: ?NodePatcher, target: NodePatcher, step: ?NodePatcher, filter: ?NodePatcher, body: BlockPatcher) {
    super(patcherContext, keyAssignee, valAssignee, target, filter, body);
    this.step = step;
  }

  initialize() {
    super.initialize();
    if (this.step) {
      this.step.setRequiresExpression();
    }
  }

  patchAsExpression() {
    // When possible, we want to transform the loop into a use of `map`, but
    // there are some cases when we can't. Use the more general approach of a
    // statement loop within an IIFE if that's the case.
    if (!this.canPatchAsMapExpression()) {
      return super.patchAsExpression();
    }
    this.removeThenToken();

    let assigneeCode = this.getValueBinding();
    if (this.keyAssignee) {
      assigneeCode += `, ${this.getIndexBinding()}`;
    }

    // for a in b when c d  ->  b when c d
    // ("then" was removed above).
    this.remove(this.contentStart, this.target.outerStart);

    if (this.shouldWrapMapExpressionTargetInArrayFrom()) {
      this.insert(this.target.contentStart, 'Array.from(');
    }
    this.target.patch();
    if (this.shouldWrapMapExpressionTargetInArrayFrom()) {
      this.insert(this.target.contentEnd, ')');
    }

    if (this.filter !== null) {
      // b when c d  ->  b.filter((a) => c d
      this.overwrite(
        this.target.outerEnd, this.filter.outerStart,
        `.filter((${assigneeCode}) => `
      );
      this.filter.patch();
      // b.filter((a) => c d  ->  b.filter((a) => c).map((a) => d
      this.insert(this.filter.outerEnd, `).map((${assigneeCode}) =>`);
    } else {
      // b d  ->  b.map((a) => d
      this.insert(this.target.outerEnd, `.map((${assigneeCode}) =>`);
    }
    this.patchBodyForExpressionLoop();
    // b.filter((a) => c).map((a) => d  ->  b.filter((a) => c).map((a) => d)
    this.insert(this.body.outerEnd, ')');
  }

  patchBodyForExpressionLoop() {
    this.body.setRequiresExpression();
    let bodyNeedsParens = isObjectInitialiserBlock(this.body)
      && !this.body.isSurroundedByParentheses();
    if (bodyNeedsParens) {
      let insertPoint = this.filter ? this.filter.outerEnd : this.target.outerEnd;
      // Handle both inline and multiline cases by either skipping the existing
      // space or adding one.
      if (this.slice(insertPoint, insertPoint + 1) === ' ') {
        this.body.insert(insertPoint + 1, '(');
      } else {
        this.body.insert(insertPoint, ' (');
      }
    }
    this.body.patch();
    if (bodyNeedsParens) {
      this.body.insert(this.body.outerEnd, ')');
    }
  }

  canPatchAsMapExpression(): boolean {
    if (this.step !== null) {
      return false;
    }
    if (!this.body.canPatchAsExpression()) {
      return false;
    }
    // The high-level approach of a.filter(...).map((x, i) => ...) doesn't work,
    // since the filter will change the indexes, so we specifically exclude that
    // case.
    if (this.filter !== null && this.keyAssignee !== null) {
      return false;
    }
    return true;
  }

  willPatchAsIIFE(): boolean {
    return this.willPatchAsExpression() && !this.canPatchAsMapExpression();
  }

  patchAsStatement() {
    if (!this.body.inline()) {
      this.body.setIndent(this.getLoopBodyIndent());
    }

    if (this.shouldPatchAsForOf()) {
      this.getFilterCode();
      this.patchForOfLoop();
    } else {
      // Run for the side-effect of patching and slicing the value.
      this.getValueBinding();
      this.getFilterCode();

      this.patchForLoopHeader();
      this.patchForLoopBody();
    }
  }

  /**
   * As long as we aren't using the loop index or a step, we prefer to use JS
   * for-of loops.
   */
  shouldPatchAsForOf() {
    return (
      !this.shouldPatchAsInitTestUpdateLoop() &&
      this.step === null &&
      this.keyAssignee === null
    );
  }

  getValueBinding(): string {
    if (!this._valueBinding) {
      if (this.valAssignee) {
        this._valueBinding = this.valAssignee.patchAndGetCode();
      } else if (this.shouldPatchAsInitTestUpdateLoop()) {
        this._valueBinding = this.claimFreeBinding(this.indexBindingCandidates());
      } else {
        this._valueBinding = this.claimFreeBinding('value');
      }
    }
    return this._valueBinding;
  }

  /**
   * @protected
   */
  computeIndexBinding(): string {
    if (this.shouldPatchAsInitTestUpdateLoop()) {
      return this.getValueBinding();
    } else {
      return super.computeIndexBinding();
    }
  }

  patchForLoopHeader() {
    if (this.requiresExtractingTarget()) {
      this.insert(this.innerStart, `${this.getTargetReference()} = ${this.getTargetCode()}\n${this.getLoopIndent()}`);
    }
    let firstHeaderPatcher = this.valAssignee || this.target;
    let lastHeaderPatcher = this.getLastHeaderPatcher();
    this.overwrite(
      firstHeaderPatcher.outerStart,
      lastHeaderPatcher.outerEnd,
      `(${this.getInitCode()}; ${this.getTestCode()}; ${this.getUpdateCode()}) {`
    );
  }

  getLastHeaderPatcher(): NodePatcher {
    return [this.step, this.filter, this.target]
      .filter(patcher => patcher)
      .reduce((last, patcher) =>
        patcher.contentEnd > last.contentEnd ? patcher : last
      );
  }

  patchForLoopBody() {
    this.removeThenToken();
    this.patchPossibleNewlineAfterLoopHeader(this.getLastHeaderPatcher().outerEnd);

    if (!this.shouldPatchAsInitTestUpdateLoop() && this.valAssignee) {
      let valueAssignment = `${this.getValueBinding()} = ${this.getTargetReference()}[${this.getIndexBinding()}]`;
      if (this.valAssignee.statementNeedsParens()) {
        valueAssignment = `(${valueAssignment})`;
      }
      this.body.insertLineBefore(valueAssignment, this.getOuterLoopBodyIndent());
    }
    this.patchBodyAndFilter();
  }

  /**
   * Special case for patching for-of case for when the loop is simple enough
   * that for-of works. Note that for-of has slightly different semantics
   * because it uses the iterator protocol rather than CoffeeScript's notion of
   * an array-like object, so this transform sacrifices 100% correctness in
   * favor of cleaner code.
   */
  patchForOfLoop() {
    // Save the filter code and remove if it it's there.
    this.getFilterCode();
    if (this.filter) {
      this.remove(this.target.outerEnd, this.filter.outerEnd);
    }

    if (this.valAssignee) {
      let relationToken = this.getRelationToken();
      this.valAssignee.patch();
      this.insert(this.valAssignee.outerStart, '(');
      this.overwrite(relationToken.start, relationToken.end, 'of');
    } else {
      // Handle loops like `for [0..2]`
      let valueBinding = this.getValueBinding();
      this.insert(this.target.outerStart, `(let ${valueBinding} of `);
    }

    if (this.shouldWrapForOfStatementTargetInArrayFrom()) {
      this.insert(this.target.outerStart, 'Array.from(');
    }
    this.target.patch();
    if (this.shouldWrapForOfStatementTargetInArrayFrom()) {
      this.insert(this.target.outerEnd, ')');
    }
    this.insert(this.target.outerEnd, ') {');
    this.removeThenToken();
    this.patchBodyAndFilter();
  }

  requiresExtractingTarget() {
    return (
      !this.shouldPatchAsInitTestUpdateLoop() &&
      !this.target.isRepeatable() &&
      !this.shouldPatchAsForOf()
    );
  }

  targetBindingCandidate() {
    return 'iterable';
  }

  getInitCode(): string {
    let step = this.getStep();
    if (this.shouldPatchAsInitTestUpdateLoop()) {
      return `${this.getIndexBinding()} = ${this.target.left.patchAndGetCode()}`;
    } else if (step.negated) {
      return `${this.getIndexBinding()} = ${this.getTargetReference()}.length - 1`;
    } else {
      let result = `${this.getIndexBinding()} = 0`;
      if (!step.isLiteral) {
        result += `, ${step.update} = ${step.init}`;
      }
      return result;
    }
  }

  getTestCode(): string {
    let step = this.getStep();
    if (this.shouldPatchAsInitTestUpdateLoop()) {
      let direction = this.getIndexDirection();
      let inclusive = this.target.isInclusive();
      let operator;

      if (direction === DOWN) {
        operator = inclusive ? '>=' : '>';
      } else {
        operator = inclusive ? '<=' : '<';
      }

      return `${this.getIndexBinding()} ${operator} ${this.target.right.patchAndGetCode()}`;
    } else if (step.negated) {
      return `${this.getIndexBinding()} >= 0`;
    } else {
      return `${this.getIndexBinding()} < ${this.getTargetReference()}.length`;
    }
  }

  getUpdateCode(): string {
    let indexBinding = this.getIndexBinding();
    let step = this.getStep();
    let direction = this.getIndexDirection();
    if (step.number === 1) {
      return `${indexBinding}${direction === DOWN ? '--' : '++'}`;
    } else if (direction === DOWN) {
      return `${indexBinding} -= ${step.update}`;
    } else {
      return `${indexBinding} += ${step.update}`;
    }
  }

  getStep(): Step {
    if (this._step === undefined) {
      this._step = new Step(this.step);
    }
    return this._step;
  }

  /**
   * Can we patch using `for (;;)` style?
   *
   * Currently, that requires either a fixed range:
   *
   *   a() for [0..1]
   *
   * Or a dynamic range with a fixed step:
   *
   *   a() for [n..m] by 1
   *
   * Eventually, we could also support any dynamic range:
   *
   *   a() for [from..to]
   *   a() for [lower()..upper()]
   *
   * By capturing the bounds as needed and comparing:
   *
   *   for (let asc = from <= to, i = from; asc ? i <= to : i >= to; asc ? i++ : i--) {
   *     a();
   *   }
   *   for (let start = lower(), end = upper(), asc = start <= end, i = start; asc ? i <= end : i >= end; asc ? i++ : i--) {
   *     a();
   *   }
   */
  shouldPatchAsInitTestUpdateLoop(): boolean {
    return this.hasFixedRange() || (this.hasDynamicRange() && this.hasExplicitStep());
  }

  shouldWrapMapExpressionTargetInArrayFrom() {
    return !this.options.looseForExpressions && !this.isTargetAlreadyArray();
  }

  shouldWrapForOfStatementTargetInArrayFrom() {
    return !this.options.looseForOf && !this.isTargetAlreadyArray();
  }

  /**
   * Determine if the loop target is statically known to be an array. If so,
   * then there's no need to use Array.from to convert from an array-like object
   * to an array.
   */
  isTargetAlreadyArray() {
    return this.target instanceof RangePatcher || this.target instanceof ArrayInitialiserPatcher;
  }

  /**
   * Determines whether this `for…in` loop has an explicit `by` step.
   */
  hasExplicitStep(): boolean {
    return !this.getStep().isVirtual;
  }

  /**
   * Determines the direction of index iteration, either UP, DOWN, or UNKNOWN.
   * UNKNOWN means that we cannot statically determine the direction.
   */
  getIndexDirection(): IndexDirection {
    let step = this.getStep();
    if (step.isVirtual && this.hasFixedRange()) {
      let left = this.target.left.node.data;
      let right = this.target.right.node.data;
      return left > right ? DOWN : UP;
    } else if (this.hasDynamicRange()) {
      return UNKNOWN;
    } else {
      return step.negated ? DOWN : UP;
    }
  }

  /**
   * Are we looping over a range with dynamic start/end?
   *
   * @example
   *
   *   for [a..b]
   *   for [0..b]
   */
  hasDynamicRange(): boolean {
    return (this.target instanceof RangePatcher) && !this.hasFixedRange();
  }

  /**
   * Are we looping over a range with fixed (static) start/end?
   *
   * @example
   *
   *   for [0..3]
   *   for [7.0..10.0]
   */
  hasFixedRange(): boolean {
    return (
      this.target instanceof RangePatcher &&
      (this.target.left.node.type === 'Int' || this.target.left.node.type === 'Float') &&
      (this.target.right.node.type === 'Int' || this.target.right.node.type === 'Float')
    );
  }
}

class Step {
  isLiteral: boolean;
  isVirtual: boolean;
  negated: boolean;
  init: string;
  update: string;
  number: ?number;
  raw: string;

  constructor(patcher: ?NodePatcher) {
    let negated = false;
    let root = patcher;
    let apply = (patcher: NodePatcher) => {
      if (patcher.node.type === 'UnaryNegateOp') {
        negated = !negated;
        apply(patcher.expression);
      } else {
        root = patcher;
      }
    };
    if (patcher) {
      apply(patcher);
      patcher.patch();
      this.isLiteral = root.node.type === 'Int' || root.node.type === 'Float';
      this.init = patcher.slice(patcher.contentStart, patcher.contentEnd);
      if (this.isLiteral) {
        this.update = root.slice(root.contentStart, root.contentEnd);
        this.number = root.node.data;
      } else {
        this.update = root.claimFreeBinding('step');
        this.number = null;
      }
    } else {
      this.isLiteral = true;
      this.init = '1';
      this.update = '1';
      this.number = 1;
    }
    this.negated = negated;
    this.isVirtual = !patcher;
  }
}

import ArrayInitialiserPatcher from './ArrayInitialiserPatcher';
import BlockPatcher from './BlockPatcher';
import IdentifierPatcher from './IdentifierPatcher';
import ForPatcher from './ForPatcher';
import RangePatcher from './RangePatcher';
import countVariableUsages from '../../../utils/countVariableUsages';
import blockStartsWithObjectInitialiser from '../../../utils/blockStartsWithObjectInitialiser';
import Scope from '../../../utils/Scope';
import traverse from '../../../utils/traverse';
import type NodePatcher from './../../../patchers/NodePatcher';
import type { PatcherContext } from './../../../patchers/types';
import {
  REMOVE_ARRAY_FROM,
  SIMPLIFY_DYNAMIC_RANGE_LOOPS
} from '../../../suggestions';

const UP = 'UP';
const DOWN = 'DOWN';
const UNKNOWN = 'UNKNOWN';
type IndexDirection = 'UP' | 'DOWN' | 'UNKNOWN';

export default class ForInPatcher extends ForPatcher {
  constructor(patcherContext: PatcherContext, keyAssignee: ?NodePatcher, valAssignee: ?NodePatcher, target: NodePatcher, step: ?NodePatcher, filter: ?NodePatcher, body: BlockPatcher) {
    super(patcherContext, keyAssignee, valAssignee, target, filter, body);
    this.step = step;
    this._internalIndexBinding = null;
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

    let mapInsertPoint;
    if (this.filter !== null) {
      // b when c d  ->  b.filter((a) => c d
      this.overwrite(
        this.target.outerEnd, this.filter.outerStart,
        `.filter((${assigneeCode}) => `
      );
      this.filter.patch();
      // b.filter((a) => c d  ->  b.filter((a) => c).map((a) => d
      this.insert(this.filter.outerEnd, `)`);
      mapInsertPoint = this.filter.outerEnd;
    } else {
      mapInsertPoint = this.target.outerEnd;
    }
    if (this.isMapBodyNoOp()) {
      this.remove(mapInsertPoint, this.body.outerEnd);
    } else {
      // b d  ->  b.map((a) => d
      this.insert(mapInsertPoint, `.map((${assigneeCode}) =>`);
      this.patchBodyForExpressionLoop();
      // b.filter((a) => c).map((a) => d  ->  b.filter((a) => c).map((a) => d)
      this.insert(this.body.outerEnd, ')');
    }
  }

  /**
   * In a case like `x = for a in b when c then a`, we should skip the `map`
   * altogether and just use a `filter`.
   */
  isMapBodyNoOp() {
    if (this.valAssignee instanceof IdentifierPatcher) {
      let varName = this.valAssignee.node.data;
      if (this.body instanceof BlockPatcher &&
          this.body.statements.length === 1 &&
          this.body.statements[0] instanceof IdentifierPatcher &&
          this.body.statements[0].node.data === varName) {
        return true;
      }
    }
    return false;
  }

  patchBodyForExpressionLoop() {
    this.body.setRequiresExpression();
    let bodyNeedsParens = blockStartsWithObjectInitialiser(this.body)
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
    if (!this.canAssigneesBecomeParams()) {
      return false;
    }
    if (this.step !== null) {
      return false;
    }
    if (this.body === null || !this.body.prefersToPatchAsExpression()) {
      return false;
    }
    // The high-level approach of a.filter(...).map((x, i) => ...) doesn't work,
    // since the filter will change the indexes, so we specifically exclude that
    // case.
    if (this.filter !== null && this.keyAssignee !== null) {
      return false;
    }
    if (this.body.containsYield() || (this.filter && this.filter.containsYield())) {
      return false;
    }
    return true;
  }

  canAssigneesBecomeParams() {
    let assignees = [this.valAssignee, this.keyAssignee].filter(assignee => assignee);
    for (let assignee of assignees) {
      if (!(assignee instanceof IdentifierPatcher)) {
        return false;
      }
      let name = assignee.node.data;
      // Find the enclosing function or program node for the binding so we can
      // find all usages of this variable.
      let assignmentNode = this.getScope().getBinding(name);
      if (!assignmentNode) {
        throw this.error('Expected loop assignee to have a binding in its scope.');
      }
      let containerNode = this.context.getScope(assignmentNode).containerNode;
      // If the number of usages in the enclosing function is more than the
      // number of usages in the loop, then there must be some external usages,
      // so we can't safely change this to a parameter.
      if (countVariableUsages(containerNode, name) !== countVariableUsages(this.node, name)) {
        return false;
      }
    }
    return true;
  }

  willPatchAsIIFE(): boolean {
    return this.willPatchAsExpression() && !this.canPatchAsMapExpression();
  }

  patchAsStatement() {
    if (this.body && !this.body.inline()) {
      this.body.setIndent(this.getLoopBodyIndent());
    }

    if (this.shouldPatchAsForOf()) {
      this.getFilterCode();
      this.patchForOfLoop();
    } else {
      // Run for the side-effect of patching and slicing the value.
      this.getIndexBinding();
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

  getLoopHeaderEnd() {
    return Math.max(
      this.step ? this.step.outerEnd : -1,
      super.getLoopHeaderEnd()
    );
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

  /**
   * Determine the name that will be used as the source of truth for the index
   * during loop iteration. If the code modifies the user-specified index during
   * the loop body, we need to choose a different variable name and make the
   * loop code a little more complex.
   */
  getInternalIndexBinding() {
    if (!this._internalIndexBinding) {
      if (this.needsUniqueIndexName()) {
        this._internalIndexBinding = this.claimFreeBinding(this.indexBindingCandidates());
      } else {
        this._internalIndexBinding = this.getIndexBinding();
      }
    }
    return this._internalIndexBinding;
  }

  needsUniqueIndexName() {
    let userIndex = this.getIndexBinding();

    // We need to extract this to a variable if there's an assignment within the
    // loop, but assignments outside the loop are fine, so we make a fake scope
    // that only looks at assignments within the loop body. But assignments
    // within closures could also happen temporally in the loop, so bail out if
    // we see one of those.
    if (this.getScope().hasInnerClosureModification(userIndex)) {
      return true;
    }
    let fakeScope = new Scope(this.node, null);
    traverse(this.node, child => {
      fakeScope.processNode(child);
    });
    return fakeScope.hasModificationAfterDeclaration(userIndex);
  }

  getInitCode(): string {
    let step = this.getStep();
    if (this.shouldPatchAsInitTestUpdateLoop()) {
      let assignments = [];
      if (this.shouldExtractStart()) {
        assignments.push(`${this.getStartReference()} = ${this.getStartCode()}`);
      }
      assignments.push(`${this.getInternalIndexBinding()} = ${this.getStartReference()}`);
      if (this.getInternalIndexBinding() !== this.getIndexBinding()) {
        assignments.push(`${this.getIndexBinding()} = ${this.getInternalIndexBinding()}`);
      }
      if (!this.isEndFixed()) {
        assignments.push(`${this.getEndReference()} = ${this.getEndCode()}`);
      }
      if (!step.isLiteral) {
        assignments.push(`${step.update} = ${step.init}`);
      }
      if (this.getIndexDirection() === UNKNOWN) {
        assignments.push(`${this.getAscReference()} = ${this.getAscCode()}`);
      }
      return assignments.join(', ');
    } else {
      let direction = this.getIndexDirection();
      let descInit = `${this.getTargetReference()}.length - 1`;

      let assignments = [];
      if (!step.isLiteral) {
        assignments.push(`${step.update} = ${step.init}`);
      }
      if (direction === DOWN) {
        assignments.push(`${this.getInternalIndexBinding()} = ${descInit}`);
      } else if (direction === UP) {
        assignments.push(`${this.getInternalIndexBinding()} = 0`);
      } else {
        assignments.push(`${this.getAscReference()} = ${this.getAscCode()}`);
        assignments.push(`${this.getInternalIndexBinding()} = ${this.getAscReference()} ? 0 : ${descInit}`);
      }
      if (this.getInternalIndexBinding() !== this.getIndexBinding()) {
        assignments.push(`${this.getIndexBinding()} = ${this.getInternalIndexBinding()}`);
      }
      return assignments.join(', ');
    }
  }

  getTestCode(): string {
    let direction = this.getIndexDirection();
    if (this.shouldPatchAsInitTestUpdateLoop()) {
      let inclusive = this.target.isInclusive();
      let gt = inclusive ? '>=' : '>';
      let lt = inclusive ? '<=' : '<';
      let index = this.getInternalIndexBinding();
      let end = this.getEndReference();

      if (direction === DOWN) {
        return `${index} ${gt} ${end}`;
      } else if (direction === UP) {
        return `${index} ${lt} ${end}`;
      } else {
        return `${this.getAscReference()} ? ${index} ${lt} ${end} : ${index} ${gt} ${end}`;
      }
    } else {
      let downComparison = `${this.getInternalIndexBinding()} >= 0`;
      let upComparison = `${this.getInternalIndexBinding()} < ${this.getTargetReference()}.length`;
      if (direction === DOWN) {
        return downComparison;
      } else if (direction === UP) {
        return upComparison;
      } else {
        return `${this.getAscReference()} ? ${upComparison} : ${downComparison}`;
      }
    }
  }

  getUpdateCode(): string {
    let assignments = [this.getUpdateAssignment()];
    if (this.getInternalIndexBinding() !== this.getIndexBinding()) {
      assignments.push(`${this.getIndexBinding()} = ${this.getInternalIndexBinding()}`);
    }
    return assignments.join(', ');
  }

  getUpdateAssignment(): string {
    let index = this.getInternalIndexBinding();
    let step = this.getStep();

    // If step is a variable, we always just add it, since its value determines
    // whether we go forward or backward.
    if (step.number === null) {
      return `${index} += ${step.update}`;
    }

    let direction = this.getIndexDirection();
    let incCode = step.number === 1 ? '++' : ` += ${step.update}`;
    let decCode = step.number === 1 ? '--' : ` -= ${step.update}`;

    if (direction === DOWN) {
      return `${index}${decCode}`;
    } else if (direction === UP) {
      return `${index}${incCode}`;
    } else {
      return `${this.getAscReference()} ? ${index}${incCode} : ${index}${decCode}`;
    }
  }

  getStartReference() {
    if (!this.shouldExtractStart()) {
      return this.getStartCode();
    }
    if (!this._startReference) {
      this._startReference = this.claimFreeBinding('start');
    }
    return this._startReference;
  }

  isStartFixed() {
    return this.target.left.node.type === 'Int' || this.target.left.node.type === 'Float';
  }

  /**
   * In many cases, we can just initialize the index to the start without an
   * intermediate variable. We only need to save a variable if it's not
   * repeatable and we need to use it to compute the direction.
   */
  shouldExtractStart() {
    return !this.target.left.isRepeatable() &&
      this.getIndexDirection() === UNKNOWN &&
      this.getStep().isVirtual;
  }

  getStartCode() {
    if (!this._startCode) {
      this._startCode = this.target.left.patchAndGetCode();
    }
    return this._startCode;
  }

  getEndReference() {
    if (this.isEndFixed()) {
      return this.getEndCode();
    }
    if (!this._endReference) {
      this._endReference = this.claimFreeBinding('end');
    }
    return this._endReference;
  }

  isEndFixed() {
    return this.target.right.node.type === 'Int' || this.target.right.node.type === 'Float';
  }

  getEndCode() {
    if (!this._endCode) {
      this._endCode = this.target.right.patchAndGetCode();
    }
    return this._endCode;
  }

  getAscReference() {
    if (!this._ascReference) {
      this._ascReference = this.claimFreeBinding('asc');
    }
    return this._ascReference;
  }

  /**
   * Return the code snippet to determine whether the loop counts up or down, in
   * the event that it needs to be computed at runtime.
   */
  getAscCode() {
    let step = this.getStep();
    if (step.isVirtual) {
      if (!this.shouldPatchAsInitTestUpdateLoop()) {
        throw new Error(
          'Should not be getting asc code when the target is not a range and ' +
          'the step is unspecified.');
      }
      return `${this.getStartReference()} <= ${this.getEndReference()}`;
    } else {
      return `${step.update} > 0`;
    }
  }

  getStep(): Step {
    if (this._step === undefined) {
      this._step = new Step(this.step);
    }
    return this._step;
  }

  /**
   * Determine if we should patch in a way where the loop variable is updated in
   * a C-style for loop. This happens when looping over a range (e.g.
   * `for i of [a...b]`, and in fact we must patch in the style when looping
   * over ranges since CoffeeScript code might depend on the variable being one
   * past the end after the loop runs to completion.
   *
   * For more complicated cases, we need to dynamically compute what direction
   * to iterate in.
   */
  shouldPatchAsInitTestUpdateLoop(): boolean {
    return this.target instanceof RangePatcher;
  }

  shouldWrapMapExpressionTargetInArrayFrom() {
    let shouldWrap = !this.options.looseForExpressions && !this.isTargetAlreadyArray();
    if (shouldWrap) {
      this.addSuggestion(REMOVE_ARRAY_FROM);
    }
    return shouldWrap;
  }

  shouldWrapForOfStatementTargetInArrayFrom() {
    let shouldWrap = !this.options.looseForOf && !this.isTargetAlreadyArray();
    if (shouldWrap) {
      this.addSuggestion(REMOVE_ARRAY_FROM);
    }
    return shouldWrap;
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
    if (this.shouldPatchAsInitTestUpdateLoop()) {
      if (!step.isVirtual && step.isLiteral) {
        return step.negated ? DOWN : UP;
      } else if (this.hasFixedRange()) {
        let left = this.target.left.node.data;
        let right = this.target.right.node.data;
        return left > right ? DOWN : UP;
      } else {
        this.addSuggestion(SIMPLIFY_DYNAMIC_RANGE_LOOPS);
        return UNKNOWN;
      }
    } else {
      if (step.isLiteral) {
        return step.negated ? DOWN : UP;
      } else {
        this.addSuggestion(SIMPLIFY_DYNAMIC_RANGE_LOOPS);
        return UNKNOWN;
      }
    }
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
    return this.target instanceof RangePatcher && this.isStartFixed() && this.isEndFixed();
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
      this.isLiteral = root.node.type === 'Int' || root.node.type === 'Float';
      this.init = patcher.patchAndGetCode();
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

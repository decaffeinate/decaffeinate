import ForPatcher from './ForPatcher.js';
import type BlockPatcher from './BlockPatcher.js';
import type NodePatcher from './../../../patchers/NodePatcher.js';
import type { Node, ParseContext, Editor } from './../../../patchers/types.js';

export default class ForInPatcher extends ForPatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, keyAssignee: ?NodePatcher, valAssignee: ?NodePatcher, target: NodePatcher, step: ?NodePatcher, filter: ?NodePatcher, body: BlockPatcher) {
    super(node, context, editor, keyAssignee, valAssignee, target, filter, body);
    this.step = step;
  }

  initialize() {
    super.initialize();
    if (this.step) {
      this.step.setRequiresExpression();
    }
  }

  patchAsStatement() {
    // Run for the side-effect of patching and slicing the value.
    this.getValueBinding();
    this.getFilterCode();

    this.patchForLoopHeader();
    this.patchForLoopBody();
  }

  getValueBinding(): string {
    if (!this._valueBinding) {
      let { valAssignee } = this;
      valAssignee.patch();
      this._valueBinding = this.slice(valAssignee.contentStart, valAssignee.contentEnd);
    }
    return this._valueBinding;
  }

  patchForLoopHeader() {
    if (!this.target.isRepeatable()) {
      this.insert(this.outerStart, `${this.getTargetReference()} = ${this.getTargetCode()}\n${this.getIndent()}`);
    }
    let firstHeaderPatcher = this.valAssignee;
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

    let valueAssignment = `${this.getValueBinding()} = ${this.getTargetReference()}[${this.getIndexBinding()}]`;
    if (this.valAssignee.statementNeedsParens()) {
      valueAssignment = `(${valueAssignment})`;
    }

    let { filter, body } = this;

    body.insertStatementsAtIndex([valueAssignment], 0);
    if (filter) {
      body.insertStatementsAtIndex([`if (${this.getFilterCode()}) {`], 0);
      body.patch({ leftBrace: false, rightBrace: false });
      body.indent();
      body.appendLineAfter('}', -1);
      body.appendLineAfter('}', -2);
    } else {
      body.patch({ leftBrace: false });
    }
  }

  getFilterCode(): ?string {
    let filter = this.filter;
    if (!filter) {
      return null;
    }
    if (!this._filterCode) {
      filter.patch();
      this._filterCode = this.slice(filter.contentStart, filter.contentEnd);
    }
    return this._filterCode;
  }

  getInitCode(): string {
    let step = this.getStep();
    if (step.negated) {
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
    if (step.negated) {
      return `${this.getIndexBinding()} >= 0`;
    } else {
      return `${this.getIndexBinding()} < ${this.getTargetReference()}.length`;
    }
  }

  getTargetCode(): string {
    // Trigger patching the reference.
    this.getTargetReference();
    return this.slice(this.target.contentStart, this.target.contentEnd);
  }

  getTargetReference(): string {
    if (!this._targetReference) {
      this.target.patch();
      if (this.target.isRepeatable()) {
        this._targetReference = this.slice(this.target.contentStart, this.target.contentEnd);
      } else {
        this._targetReference = this.claimFreeBinding('iterable');
      }
    }
    return this._targetReference;
  }

  getUpdateCode(): string {
    let indexBinding = this.getIndexBinding();
    let step = this.getStep();
    if (step.number === 1) {
      return `${indexBinding}${step.negated ? '--' : '++'}`;
    } else if (step.negated) {
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
}

class Step {
  isLiteral: boolean;
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
  }
}

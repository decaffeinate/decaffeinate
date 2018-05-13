import { SourceType } from 'coffee-lex';

import NodePatcher from './../../../patchers/NodePatcher';
import BlockPatcher from './BlockPatcher';
import ConstructorPatcher from './ConstructorPatcher';
import FunctionPatcher from './FunctionPatcher';
import IdentifierPatcher from './IdentifierPatcher';
import ProgramPatcher from './ProgramPatcher';

import {
  AssignOp,
  BaseAssignOp,
  BaseFunction,
  ClassProtoAssignOp,
  DynamicMemberAccessOp,
  Identifier,
  MemberAccessOp,
  Node,
  This
} from 'decaffeinate-parser/dist/nodes';
import { PatcherContext } from '../../../patchers/types';
import { AVOID_INITCLASS } from '../../../suggestions';

export type NonMethodInfo = {
  patcher: NodePatcher;
  deleteStart: number;
};

export type CustomConstructorInfo = {
  ctorName: string;
  expressionCode: string;
};

export default class ClassPatcher extends NodePatcher {
  nameAssignee: NodePatcher | null;
  superclass: NodePatcher | null;
  body: BlockPatcher | null;

  constructor(
    patcherContext: PatcherContext,
    nameAssignee: NodePatcher | null,
    parent: NodePatcher | null,
    body: BlockPatcher | null
  ) {
    super(patcherContext);
    this.nameAssignee = nameAssignee;
    this.superclass = parent;
    this.body = body;
  }

  /**
   * Handle code within class bodies by restructuring the class to use a static
   * method instead.
   *
   * Current limitations:
   * - Doesn't deconflict the "initClass" name of the static method.
   * - Technically this changes the execution order of the class body, although
   *   it does so in a way that is unlikely to cause problems in reasonable
   *   code.
   */
  patchAsStatement(): void {
    // Indentation needs to happen before child patching in case we have child
    // classes or other nested indentation situations.
    if (this.needsIndent()) {
      this.indent(1, { skipFirstLine: true });
    }
    // We also need to remove `then` early so it doesn't remove other inserted
    // code.
    this.removeThenTokenIfNecessary();

    let indent = this.getIndent();

    if (this.nameAssignee) {
      this.nameAssignee.patch();
    }
    if (this.superclass) {
      this.superclass.patch();
    }
    if (this.body) {
      this.body.patch();
    }

    if (!this.needsInitClass()) {
      return;
    }

    this.addSuggestion(AVOID_INITCLASS);
    let insertPoint = this.getInitClassInsertPoint();
    let nonMethodPatchers = this.getNonMethodPatchers();
    let customConstructorInfo = this.extractCustomConstructorInfo();

    let shouldUseIIFE = this.shouldUseIIFE();

    if (shouldUseIIFE) {
      // If the class declaration might introduce a variable, we need to make
      // sure that assignment happens outside the IIFE so that it can be used
      // by the outside world.
      if (this.nameAssignee instanceof IdentifierPatcher) {
        this.insert(this.outerStart, `${this.nameAssignee.node.data} = `);
      }
      this.insert(this.outerStart, `do ->\n${indent}`);
    }

    let needsTmpName = false;
    let classRef;
    if (this.nameAssignee instanceof IdentifierPatcher) {
      classRef = this.nameAssignee.node.data;
    } else {
      classRef = this.claimFreeBinding('Cls');
      needsTmpName = true;
    }

    let assignmentNames = this.generateInitClassMethod(nonMethodPatchers, customConstructorInfo, insertPoint);
    this.insert(this.outerEnd, `\n${indent}${classRef}.initClass()`);
    if (shouldUseIIFE) {
      this.insert(this.outerEnd, `\n${indent}return ${classRef}`);
    }

    for (let assignmentName of assignmentNames) {
      this.insert(this.outerStart, `${assignmentName} = undefined\n${indent}`);
    }
    if (needsTmpName) {
      this.insert(this.outerStart, `${classRef} = `);
    }
  }

  /**
   * For now, code in class bodies is only supported for statement classes.
   */
  patchAsExpression(): void {
    if (this.body) {
      this.body.patch();
    }
  }

  needsIndent(): boolean {
    return this.needsInitClass() && this.shouldUseIIFE();
  }

  needsInitClass(): boolean {
    if (!this.body) {
      return false;
    }
    if (this.body.statements.length === 0) {
      return false;
    }

    let nonMethodPatchers = this.getNonMethodPatchers();

    if (nonMethodPatchers.length === 0 && !this.needsCustomConstructor()) {
      return false;
    }
    return true;
  }

  removeThenTokenIfNecessary(): void {
    let searchStart;
    if (this.superclass) {
      searchStart = this.superclass.outerEnd;
    } else if (this.nameAssignee) {
      searchStart = this.nameAssignee.outerEnd;
    } else {
      searchStart = this.firstToken().end;
    }
    let searchEnd;
    if (this.body) {
      searchEnd = this.body.outerStart;
    } else {
      searchEnd = this.contentEnd;
    }
    let index = this.indexOfSourceTokenBetweenSourceIndicesMatching(
      searchStart,
      searchEnd,
      token => token.type === SourceType.THEN
    );
    if (index) {
      this.overwrite(searchStart, searchEnd, `\n${this.getIndent(1)}`);
    }
  }

  shouldUseIIFE(): boolean {
    let nonMethodPatchers = this.getNonMethodPatchers();
    if (this.hasAnyAssignments(nonMethodPatchers)) {
      return true;
    }
    // It's safe to use the more straightforward class init approach as long as
    // we know that a statement can be added after us and we're not in an
    // implicit return position.
    if (this.parent instanceof BlockPatcher) {
      let { statements } = this.parent;
      if (!(this.parent.parent instanceof ProgramPatcher) && this === statements[statements.length - 1]) {
        return true;
      }
      return false;
    }
    return true;
  }

  getInitClassInsertPoint(): number {
    if (this.superclass) {
      return this.superclass.outerEnd;
    }
    if (this.nameAssignee) {
      return this.nameAssignee.outerEnd;
    }
    return this.firstToken().end;
  }

  /**
   * Find the statements in the class body that can't be converted to JS
   * methods. These will later be moved to the top of the class in a static
   * method.
   */
  getNonMethodPatchers(): Array<NonMethodInfo> {
    if (!this.body) {
      throw this.error('Expected non-null body.');
    }
    let nonMethodPatchers = [];
    let deleteStart = this.getInitClassInsertPoint();
    for (let patcher of this.body.statements) {
      if (!this.isClassMethod(patcher)) {
        nonMethodPatchers.push({
          patcher,
          deleteStart
        });
      }
      deleteStart = patcher.outerEnd;
    }
    return nonMethodPatchers;
  }

  isClassMethod(patcher: NodePatcher): boolean {
    if (patcher instanceof ConstructorPatcher) {
      return true;
    }
    let node = patcher.node;
    if (this.isClassAssignment(node)) {
      // Bound static methods must be moved to initClass so they are properly
      // bound.
      if (node instanceof AssignOp && ['BoundFunction', 'BoundGeneratorFunction'].indexOf(node.expression.type) >= 0) {
        return false;
      }
      if (node.expression instanceof BaseFunction) {
        return true;
      }
    }
    return false;
  }

  isClassAssignment(node: Node): node is BaseAssignOp {
    if (node instanceof ClassProtoAssignOp) {
      return true;
    }
    if (node instanceof AssignOp) {
      let { assignee } = node;
      if (assignee instanceof MemberAccessOp || assignee instanceof DynamicMemberAccessOp) {
        if (assignee.expression instanceof This) {
          return true;
        }
        if (this.nameAssignee && this.nameAssignee instanceof IdentifierPatcher) {
          let className = this.nameAssignee.node.data;
          if (assignee.expression instanceof Identifier && assignee.expression.data === className) {
            return true;
          }
        }
      }
    }
    return false;
  }

  needsCustomConstructor(): boolean {
    if (!this.body) {
      throw this.error('Expected non-null body.');
    }
    for (let patcher of this.body.statements) {
      if (patcher instanceof ConstructorPatcher && !(patcher.expression instanceof FunctionPatcher)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Constructors in CoffeeScript can be arbitrary expressions, so if that's the
   * case, we need to save that expression so we can compute it at class init
   * time and call it from the real constructor. If this is such a case, pick a
   * name for the constructor, get the code to evaluate the constructor
   * function, and overwrite the constructor with a function that forwards to
   * that constructor function.
   */
  extractCustomConstructorInfo(): CustomConstructorInfo | null {
    if (!this.body) {
      throw this.error('Expected non-null body.');
    }
    for (let patcher of this.body.statements) {
      if (patcher instanceof ConstructorPatcher) {
        if (!(patcher.expression instanceof FunctionPatcher)) {
          let expressionCode = this.slice(patcher.expression.contentStart, patcher.expression.contentEnd);
          let ctorName;
          if (this.nameAssignee instanceof IdentifierPatcher) {
            let className = this.nameAssignee.node.data;
            ctorName = this.claimFreeBinding(`create${className}`);
          } else {
            ctorName = this.claimFreeBinding('createInstance');
          }

          let bodyIndent = this.getBodyIndent();
          let indentString = this.getProgramIndentString();

          this.overwrite(
            patcher.expression.outerStart,
            patcher.expression.outerEnd,
            `->\n${bodyIndent}${indentString}return ${ctorName}.apply(this, arguments)`
          );

          return {
            ctorName,
            expressionCode
          };
        }
      }
    }
    return null;
  }

  /**
   * Create the initClass static method by moving nodes from the class body into
   * the static method and indenting them one level.
   *
   * Also return an array of variables that were assigned so that later code can
   * declare them outside the class body to make them accessible within the
   * class.
   */
  generateInitClassMethod(
    nonMethodPatchers: Array<NonMethodInfo>,
    customConstructorInfo: CustomConstructorInfo | null,
    insertPoint: number
  ): Array<string> {
    let bodyIndent = this.getBodyIndent();
    let indentString = this.getProgramIndentString();
    this.insert(insertPoint, `\n${bodyIndent}@initClass: ->`);
    let assignmentNames = [];
    for (let { patcher, deleteStart } of nonMethodPatchers) {
      let assignmentName = this.getAssignmentName(patcher);
      if (assignmentName) {
        assignmentNames.push(assignmentName);
      }
      let statementCode = this.slice(deleteStart, patcher.outerEnd);
      statementCode = statementCode.replace(/\n/g, `\n${indentString}`);
      this.insert(insertPoint, statementCode);
      this.remove(deleteStart, patcher.outerEnd);
    }
    if (customConstructorInfo) {
      let { ctorName, expressionCode } = customConstructorInfo;
      this.insert(insertPoint, `\n${bodyIndent}${indentString}${ctorName} = ${expressionCode}`);
      assignmentNames.push(ctorName);
    }

    this.insert(insertPoint, `\n${bodyIndent}${indentString}return`);
    return assignmentNames;
  }

  hasAnyAssignments(nonMethodPatchers: Array<NonMethodInfo>): boolean {
    for (let { patcher } of nonMethodPatchers) {
      if (this.getAssignmentName(patcher)) {
        return true;
      }
    }
    return false;
  }

  getBodyIndent(): string {
    if (!this.body) {
      throw this.error('Expected non-null body.');
    }
    let bodyNodeIndent = this.body.getIndent();
    // If the body is inline, generate code at one indent level up instead of
    // at the class indentation level.
    if (bodyNodeIndent === this.getIndent()) {
      return this.getIndent(1);
    } else {
      return bodyNodeIndent;
    }
  }

  /**
   * Determine the variable assigned in the given statement, if any, since any
   * assigned variables need to be declared externally so they are available
   * within the class body. Note that this is incomplete at the moment and only
   * covers the common case of a single variable being defined.
   */
  getAssignmentName(statementPatcher: NodePatcher): string | null {
    if (statementPatcher.node instanceof AssignOp && statementPatcher.node.assignee instanceof Identifier) {
      return statementPatcher.node.assignee.data;
    }
    if (statementPatcher instanceof ClassPatcher && statementPatcher.nameAssignee instanceof IdentifierPatcher) {
      return statementPatcher.nameAssignee.node.data;
    }
    return null;
  }
}

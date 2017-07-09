declare module 'ast-processor-babylon-config-types' {
  import { Node } from 'babel-types';

  export type Token = {
    type: { label: string },
    start: number,
    end: number,
  };

  export type Insertion = {
    index: number,
    content: string,
  };

  export type Removal = {
    start: number,
    end: number,
  };

  export type BabylonConfig = {
    ast: Node,
    traverse: (node: Node, iterator: (node: Node, parent: Node | null) => void) => void,

    firstTokenOfNode: (node: Node) => Token,
    lastTokenOfNode: (node: Node) => Token,
    tokenAfterToken: (token: Token) => Token | null,
    sourceOfToken: (token: Token) => string,

    startOfToken: (token: Token) => number,
    endOfToken: (token: Token) => number,
    startOfNode: (node: Node) => number,
    endOfNode: (node: Node) => number,

    insert: (index: number, content: string) => void,
    remove: (start: number, end: number) => void,
    insertions: Array<Insertion>,
    removals: Array<Removal>,
  };
}

declare module 'ast-processor-babylon-config' {
  import { BabylonConfig } from 'ast-processor-babylon-config-types';
  import { Node } from 'babel-types';

  function buildConfig(content: string, ast: Node): BabylonConfig;
  export = buildConfig;
}

declare module "automatic-semicolon-insertion" {
  import { BabylonConfig } from 'ast-processor-babylon-config-types';

  function asi(config: BabylonConfig): void;
  export = asi;
}

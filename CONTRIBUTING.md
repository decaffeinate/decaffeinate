# How to contribute

While the problem domain of decaffeinate is fairly fixed -- automated
conversion of CoffeeScript to the latest JavaScript in a way that allows moving
completely away from CoffeeScript -- it can always be improved. That's where you
come in, and this document will explain how to help.

## Get the code, get it running

```
$ git clone https://github.com/decaffeinate/decaffeinate.git
$ cd decaffeinate
$ npm install
```

Run the tests to make sure everything works as expected:

```
$ npm test
```

## Adding features

Decaffeinate is implemented primarily as a collection of patchers, objects that
know how to transform a particular CoffeeScript node type to JavaScript. They
work by editing the original CoffeeScript source code, such as inserting missing
punctuation.

### Building a patcher

Let's build a simple patcher for booleans. CoffeeScript has `true` and `false`
booleans that don't need to be changed at all. It also has aliases called `yes`
and `no`, and `on` and `off`. We need to edit the entire node when an alias is
used to be either `true` or `false`.

First, we create a subclass of `NodePatcher`, the base class for all patchers,
in `src/patchers/BoolPatcher.js`:

```js
import NodePatcher from './NodePatcher.js';

export default class BoolPatcher extends NodePatcher {}
```

Then we'd want to map the `Bool` node type to `BoolPatcher` in
`src/patchers/index.js` (it is, of course, already so mapped).

Right now `BoolPatcher` will simply throw an exception because we need to
implement `patchAsExpression` and `patchAsStatement`.

```js
import NodePatcher from './NodePatcher.js';

export default class BoolPatcher extends NodePatcher {
  patchAsExpression() {
  }
  
  patchAsStatement() {
  }
}
```

Now this patcher will not throw an exception, but it doesn't make any edits to
the original source either. There are two methods to implement,
`patchAsExpression` and `patchAsStatement`. Many CoffeeScript features that
would naturally be represented using statements in JavaScript, such as
conditionals (e.g. `if a then b else c`), can be used in expression contexts
(e.g. `a(if b then c else d)`) and would need to be translated differently
depending on whether they need to become an expression or a statement. In the
case of booleans, there's no difference, so we simply implement the expression
case and call it in the statement case.

```js
import NodePatcher from './NodePatcher.js';

export default class BoolPatcher extends NodePatcher {
  patchAsExpression() {
    // TODO
  }
  
  patchAsStatement() {
    this.patchAsExpression();
  }
}
```

We need to figure out if the original source for the boolean was something we
can simply leave as-is, or if we have to re-write it. We can access the original
source by getting `this.context.source` inside a patcher, and each patcher has
`start` and `end` properties for the source offsets for the start and end of the
node.

```js
import NodePatcher from './NodePatcher.js';

export default class BoolPatcher extends NodePatcher {
  patchAsExpression() {
    let source = this.context.source.slice(this.start, this.end);
    switch (source) {
      case 'yes':
      case 'on':
        // rewrite to 'true'
        break;
        
      case 'no':
      case 'off':
        // rewrite to 'false'
        break;
    }
  }
  
  patchAsStatement() {
    this.patchAsExpression();
  }
}
```

To rewrite, we can use the `overwrite` method:

```js
import NodePatcher from './NodePatcher.js';

export default class BoolPatcher extends NodePatcher {
  patchAsExpression() {
    let source = this.context.source.slice(this.start, this.end);
    switch (source) {
      case 'yes':
      case 'on':
        this.overwrite(this.start, this.end, 'true');
        break;
        
      case 'no':
      case 'off':
        this.overwrite(this.start, this.end, 'false');
        break;
    }
  }
  
  patchAsStatement() {
    this.patchAsExpression();
  }
}
```

Now we've got a patcher that rewrites boolean aliases to `true` and `false`! You
can [the real `BoolPatcher` here][BoolPatcher].

[BoolPatcher]: https://github.com/decaffeinate/decaffeinate/blob/master/src/patchers/BoolPatcher.js

In
addition to `overwrite`, there's `insert` and `remove` which patchers can use to
edit the source. Also, in addition to `start` and `end` there's `before` and
`after`, which point to the locations outside the bounds of any containing
parentheses. For example, for the `PlusOp` containing `foo + bar`:

```
( foo + bar ) * baz
^ ^        ^ ^
| |        | |
| start  end |
|            |
before   after
```

Depending on whether you want to insert text inside or outside the parentheses,
you'll want to use `start`/`end` or `before`/`after` respectively.

#### Patchers with children

The simplest patchers with children are ones that we don't have to edit at all,
but whose children might need editing. Let's build a patcher for handling binary
`+` (i.e. `PlusOp`). We start off as we did for the boolean patcher above by
creating `src/patchers/PlusOpPatcher.js` and editing `src/patchers/index.js`
appropriately.

```js
import NodePatcher from './NodePatcher.js';

export default class PlusOpPatcher extends NodePatcher {}
```

This time, however, we have children that will be passed to our constructor (see
[`traverse.js`][traverse-plus-op] for the names of the child properties).

[traverse-plus-op]: https://github.com/decaffeinate/decaffeinate/blob/0abe7bedaf00670ac5e7af605d79206a92d34879/src/utils/traverse.js#L93

```js
import NodePatcher from './NodePatcher.js';
import type { Token, Node, ParseContext, Editor } from './types.js';

export default class PlusOpPatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, left: NodePatcher, right: NodePatcher) {
    super(node, context, editor);
    this.left = left;
    this.right = right;
  }
}
```

Now we're storing references to our children, but we haven't yet implemented
the patch methods, `patchAsExpression` and `patchAsStatement`. Let's do that as
with `BoolPatcher` above.

```js
import NodePatcher from './NodePatcher.js';
import type { Token, Node, ParseContext, Editor } from './types.js';

export default class PlusOpPatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, left: NodePatcher, right: NodePatcher) {
    super(node, context, editor);
    this.left = left;
    this.right = right;
  }
  
  patchAsExpression() {
    // TODO
  }
  
  patchAsStatement() {
    this.patchAsExpression();
  }
}
```

What do we put inside `patchAsExpression`? Since we can simply pass the `+`
through as-is, there's no editing we need to do, but our children might so we
delegate to them.

```js
import NodePatcher from './NodePatcher.js';
import type { Token, Node, ParseContext, Editor } from './types.js';

export default class PlusOpPatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, left: NodePatcher, right: NodePatcher) {
    super(node, context, editor);
    this.left = left;
    this.right = right;
  }
  
  patchAsExpression() {
    this.left.patch();
    this.right.patch();
  }
  
  patchAsStatement() {
    this.patchAsExpression();
  }
}
```

Great! But this isn't quite finished. What if our node looked like this
`a + if b then c else d`? By default patchers will patch as statements unless
told to patch as expressions, but then we'd have
`a + if (b) { c; } else { d; };`, which isn't valid JavaScript. We have to tell
our children that they must be expressions, which we do in `initialize`.

```js
import NodePatcher from './NodePatcher.js';
import type { Token, Node, ParseContext, Editor } from './types.js';

export default class PlusOpPatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, left: NodePatcher, right: NodePatcher) {
    super(node, context, editor);
    this.left = left;
    this.right = right;
  }
  
  initialize() {
    this.left.setRequiresExpression();
    this.right.setRequiresExpression();
  }
  
  patchAsExpression() {
    this.left.patch();
    this.right.patch();
  }
  
  patchAsStatement() {
    this.patchAsExpression();
  }
}
```

Now `a + if b then c else d` will become `a + b ? c : d;` as intended, since the
`right` patcher knows to patch using `patchAsExpression` instead of
`patchAsStatement`. In reality, `PlusOp` and several other binary operators are
all handled by [`BinaryOpPatcher`][BinaryOpPatcher].

[BinaryOpPatcher]: https://github.com/decaffeinate/decaffeinate/blob/master/src/patchers/BinaryOpPatcher.js

#### TODO: More advanced patcher stuff here?

## TODO: Submitting a pull request

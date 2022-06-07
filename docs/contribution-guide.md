# How to contribute

While the problem domain of decaffeinate is fairly fixed -- automated
conversion of CoffeeScript to the latest JavaScript in a way that allows moving
completely away from CoffeeScript -- it can always be improved. That's where you
come in, and this document will explain how to help.

## Get the code, get it running

```
$ git clone https://github.com/decaffeinate/decaffeinate.git
$ cd decaffeinate
$ pnpm install
```

Run the tests to make sure everything works as expected:

```
$ pnpm test
```

## How is decaffeinate structured?

decaffeinate's main operations are performed by a collection of patchers, objects
that know how to transform a particular CoffeeScript node type to JavaScript.
They work by editing the original CoffeeScript source code, such as inserting
missing punctuation. Patchers wrap their node and have access to them with the
`node` property, though you may not need to access it directly in many cases.

The root patcher is `ProgramPatcher`, which wraps the `Program` root node.
Each patcher calls `patch()` on its children in the appropriate order, so
calling `patch()` on the root patcher will patch the whole tree.

## Debugging

The patchers log the edits they make if a matching environment variable is set.
For example, to log all the edits made by the `BlockPatcher` you can set
`DEBUG:BlockPatcher` to `1`, like so:

```
$ env 'DEBUG:BlockPatcher=1' pnpm test
```

To enable all loggers, use `DEBUG:*=1`. To log within a patcher, use the `log`
instance method like so:

```js
patchAsExpression() {
  // …
  this.log('Some text', someObject);
}
```

## Adding features

### Stages

Patchers are grouped into stages since some features cannot be done in a single
pass.

#### `normalize` stage

This stage does pre-processing and takes CoffeeScript as input and generates
CoffeeScript as output. Typically patchers will not be added here, but in the
`main` stage instead.

#### `main` stage

This stage does almost all the editing and takes CoffeeScript as input and
generates JavaScript as output.

### Building a patcher

Let's build a simple patcher for booleans. CoffeeScript has `true` and `false`
booleans that don't need to be changed at all. It also has aliases called `yes`
and `no`, and `on` and `off`. We need to edit the entire node when an alias is
used to be either `true` or `false`.

First, we create a subclass of `NodePatcher`, the base class for all patchers,
in `src/stages/main/patchers/BoolPatcher.js`:

```js
import NodePatcher from './NodePatcher.js';

export default class BoolPatcher extends NodePatcher {}
```

Then we'd want to map the `Bool` node type to `BoolPatcher` in
`src/stages/main/patchers/index.js` (it is, of course, already so mapped).

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
`contentStart` and `contentEnd` properties for the source offsets for the start
and end of the node.

```js
import NodePatcher from './NodePatcher.js';

export default class BoolPatcher extends NodePatcher {
  patchAsExpression() {
    let source = this.getOriginalSource();
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
    let source = this.getOriginalSource();
    switch (source) {
      case 'yes':
      case 'on':
        this.overwrite(this.contentStart, this.contentEnd, 'true');
        break;
        
      case 'no':
      case 'off':
        this.overwrite(this.contentStart, this.contentEnd, 'false');
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

[BoolPatcher]: https://github.com/decaffeinate/decaffeinate/blob/master/src/stages/main/patchers/BoolPatcher.js

In
addition to `overwrite`, there's `insert` and `remove` which patchers can use to
edit the source. Also, in addition to `contentStart` and `contentEnd` there's
`outerStart`, `outerEnd`, `innerStart` and `innerEnd`, which point to the
locations outside and inside the bounds of any containing parentheses. For
example, for the `PlusOp` containing `2 + 3`:

```
       innerStart
           |
outerStart | contentStart
         | | |
         ▼ ▼ ▼
     1 * ((  2 + 3  ))
                  ▲ ▲ ▲
                  | | |
         contentEnd | outerEnd
                    |
                 innerEnd
```

Which position you use depends on whether you want to insert text immediately
before or after the node's content, immediately inside any surrounding
parentheses, or outside the surrounding parentheses. Note that patchers cannot
make changes outside the range of their own `[outerStart, outerEnd)` if that
range is different from `[contentStart, contentEnd)`.

#### Patchers with children

The simplest patchers with children are ones that we don't have to edit at all,
but whose children might need editing. Let's build a patcher for handling binary
`+` (i.e. `PlusOp`). We start off as we did for the boolean patcher above by
creating `src/stages/main/patchers/PlusOpPatcher.js` and editing
`src/stages/main/patchers/index.js` appropriately.

```js
import NodePatcher from './NodePatcher.js';

export default class PlusOpPatcher extends NodePatcher {}
```

This time, however, we have children that will be passed to our constructor (see
[`traverse.js`][traverse-plus-op] for the names of the child properties).

[traverse-plus-op]: https://github.com/decaffeinate/decaffeinate/blob/0abe7bedaf00670ac5e7af605d79206a92d34879/src/utils/traverse.js#L93

```js
import NodePatcher from './NodePatcher.js';
import type { PatcherContext } from './types.js';

export default class PlusOpPatcher extends NodePatcher {
  constructor(patcherContext: PatcherContext, left: NodePatcher, right: NodePatcher) {
    super(patcherContext);
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
import type { PatcherContext } from './types.js';

export default class PlusOpPatcher extends NodePatcher {
  constructor(patcherContext: PatcherContext, left: NodePatcher, right: NodePatcher) {
    super(patcherContext);
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
import type { PatcherContext } from './types.js';

export default class PlusOpPatcher extends NodePatcher {
  constructor(patcherContext: PatcherContext, left: NodePatcher, right: NodePatcher) {
    super(patcherContext);
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
import type { PatcherContext } from './types.js';

export default class PlusOpPatcher extends NodePatcher {
  constructor(patcherContext: PatcherContext, left: NodePatcher, right: NodePatcher) {
    super(patcherContext);
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

Now `a + if b then c else d` will become `a + (b ? c : d);` as intended, since
the `right` patcher knows to patch using `patchAsExpression` instead of
`patchAsStatement`. In reality, `PlusOp` and several other binary operators are
all handled by [`BinaryOpPatcher`][BinaryOpPatcher].

[BinaryOpPatcher]: https://github.com/decaffeinate/decaffeinate/blob/master/src/stages/main/patchers/BinaryOpPatcher.js

Finally, we can omit `patchAsStatement` in this case because all it does is
delegate to `patchAsExpression`, which is the default behavior.

```js
import NodePatcher from './NodePatcher.js';
import type { PatcherContext } from './types.js';

export default class PlusOpPatcher extends NodePatcher {
  constructor(patcherContext: PatcherContext, left: NodePatcher, right: NodePatcher) {
    super(patcherContext);
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
}
```

#### Temporary variables & repeating code

Sometimes you may need to introduce temporary variables to hold values, often so
that you can repeat a bit of code without triggering side-effects twice. Here's
an example:

```coffee
a().b += c
```

In this case we can leave it alone because JavaScript has a `+=` operator, but
if we wanted to expand it manually we can't just do `a().b = a().b + c`, because
that would run `a()` twice. Since `a()` may have a side-effect, we have to cache
its result. Doing so manually we might edit it to this:

```coffee
base = a()
base.b = base.b + c
```

Now we're safe, since `a()` only runs once. As we noted, we don't have to do
this for `+=`, but we must do it for compound operators JavaScript doesn't have
like `||=`. Here's what the [`LogicalOpCompoundAssignOpPatcher`][locaop]
actually edits `a().b ||= c` to become:

```js
(base = a()).b = base.b || c
```

[locaop]: https://github.com/decaffeinate/decaffeinate/blob/master/src/stages/main/patchers/LogicalOpCompoundAssignOpPatcher.js

How does this work? This is accomplished by the `patchRepeatable` method on
patchers. It is responsible for editing its node to store the side-effecty parts
in a temporary variable and returning the source code needed to reference the
same value again. For simple values like integers and non-interpolated strings,
they make no edits and simply return their original source. Each patcher is
responsible for implementing both `isRepeatable` to determine whether it is safe
to repeat the source as-is. The `patchAsRepeatableExpression` method can be
overridden to provide a custom behavior for making the expression repeatable.
See [`MemberAccessOpPatcher`][maop] for an example.

[maop]: https://github.com/decaffeinate/decaffeinate/blob/master/src/stages/main/patchers/MemberAccessOpPatcher.js

Temporary variables may also be introduced as loop counters or similar. To claim
a temporary variable, just use the patchers' `claimFreeBinding` method,
optionally passing the name you'd like to use. If that name is taken, a numeric
suffix will be added until the name is not in use. That name will then be
reserved so that future calls cannot use it either. If you'd like to choose from
a list of names, just pass an array.

```js
let nameBinding = this.claimFreeBinding('name');
this.insertBefore(`${nameBinding} = `);

let loopCounter = this.claimFreeBinding(['i', 'j', 'k']);
this.insert(this.keyAssignee.after, `, ${loopCounter}`);
```

Don't worry about creating variable declarations when assigning to temporary
variables. The [add-variable-declarations][avd] library is used to add them as
appropriate in a post-processing step.

[avd]: https://github.com/eventualbuddha/add-variable-declarations

## Submitting a pull request

If you have found a bug or have a feature you'd like to add, it is probably
worth creating an issue to document the bug or discuss the feature before doing
significant work. Once you've decided on an approach, get the code and check
that the tests all pass as shown above, create a branch based on `master` with
a descriptive name such as `fix-binary-operator-statements` or `add-support-for-soaked-member-access`.
Make changes to fix your bug or add your feature, ensuring that you write tests
covering the changes. The tests you add or change *should fail* on `master`.

### Commit messages

We use [semantic-release](https://github.com/semantic-release/semantic-release) to do releases, which means we follow the [Angular commit message guidelines](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit). You might want to get a passing familiarity with those, but the gist is this:

* use the appropriate prefix for each commit message:
  * `fix:` prefix for bug fixes
  * `feat:` prefix for features
  * `chore:` prefix for maintenance tasks (e.g. updating dependencies)
  * `refactor:` for refactors that don't change behavior
  * `docs:` for documentation updates
* use imperative style (e.g. `add literate CoffeeScript support`)
* use lowercase on the first line of the commit message without a period
* if backward-incompatible changes are in a commit, add `BREAKING CHANGE:` to the footer of the commit with a description

Why do we use this commit message style? To automate releases. Whenever a build passes on `master`, semantic-release will look at the commits since the last release and adjust the version appropriately. Commits with `fix:` bump the patch version, `feat:` bumps the minor version, and `BREAKING CHANGE:` bumps the major version (only one of the three will be bumped per release).

Once you're satisfied with your changes, create a pull request on your own fork.
Please provide a description of *why* you're issuing the pull request, and
reference any relevant existing issues. Expect to go through a round or two of
review before a pull request is accepted.

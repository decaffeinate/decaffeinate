# Cleanup suggestions after running decaffeinate

decaffeinate [focuses on correctness as a top priority](./correctness-issues.md),
and sometimes this means the generated JavaScript code is more defensive than it
needs to be. You will likely want to spend some time cleaning up the resulting
JavaScript, and this page is a comprehensive list of everything you should know
about the JavaScript produced by decaffeinate and how to clean it up without
introducing bugs.

There are two ways to use this list:
* After running decaffeinate, each resulting JavaScript file has a list of
  suggestion codes with cleanup suggestions relevant to that file. You can jump
  to the docs for these specific suggestions, since they will be most useful to
  you.
* If you're trying to run decaffeinate on a large codebase, it's probably a good
  idea to read all points in this list to get an understanding of what cleanup
  steps will be required.

If you find that additional code cleanup advice would be useful, feel free to
file an issue or send a pull request.

# Contents

<!---
Generated using https://tableofcontents.herokuapp.com/
-->

- [DS0XX: Highest priority](#ds0xx-highest-priority)
  - [DS001: Remove Babel/TypeScript constructor workaround](#ds001-remove-babeltypescript-constructor-workaround)
- [DS1XX: Common cleanup tasks](#ds1xx-common-cleanup-tasks)
  - [DS101: Remove unnecessary use of `Array.from`](#ds101-remove-unnecessary-use-of-arrayfrom)
  - [DS102: Remove unnecessary code created because of implicit returns](#ds102-remove-unnecessary-code-created-because-of-implicit-returns)
  - [DS103: Rewrite code to no longer use `__guard__`](#ds103-rewrite-code-to-no-longer-use-__guard__)
  - [DS104: Avoid inline assignments](#ds104-avoid-inline-assignments)
  - [DS105: Use default params and defaults within assignments when possible](#ds105-use-default-params-and-defaults-within-assignments-when-possible)
- [DS2XX: Other cleanup tasks](#ds2xx-other-cleanup-tasks)
  - [DS201: Simplify complex destructure assignments](#ds201-simplify-complex-destructure-assignments)
  - [DS202: Simplify dynamic range loops](#ds202-simplify-dynamic-range-loops)
  - [DS203: Remove `|| {}` from converted for-own loops](#ds203-remove---from-converted-for-own-loops)
  - [DS204: Change `includes` calls to have a more natural evaluation order](#ds204-change-includes-calls-to-have-a-more-natural-evaluation-order)
  - [DS205: Consider reworking code to avoid use of IIFEs](#ds205-consider-reworking-code-to-avoid-use-of-iifes)
  - [DS206: Consider reworking classes to avoid `initClass`](#ds206-consider-reworking-classes-to-avoid-initclass)
  - [DS207: Consider shorter variations of null checks](#ds207-consider-shorter-variations-of-null-checks)
  - [DS208: Avoid top-level `this`](#ds208-avoid-top-level-this)
  - [DS209: Avoid top-level `return`](#ds209-avoid-top-level-return)
- [DS3XX: General considerations](#ds3xx-general-considerations)
  - [DS301: Make sure your code works in strict mode](#ds301-make-sure-your-code-works-in-strict-mode)
  - [DS302: Make sure your build system handles `Array.prototype.includes`](#ds302-make-sure-your-build-system-handles-arrayprototypeincludes)
  - [DS303: Use a formatter like ESLint or Prettier](#ds303-use-a-formatter-like-eslint-or-prettier)
  - [DS304: Consider configuring decaffeinate to convert to JS modules](#ds304-consider-configuring-decaffeinate-to-convert-to-js-modules)

# DS0XX: Highest priority

## DS001: Remove Babel/TypeScript constructor workaround

### Overview

CoffeeScript classes allow `this` to be used before `super` in a subclass
constructor, while JavaScript classes do not. To work around this issue,
decaffeinate produces a code block at the top of some constructors to trick
Babel and TypeScript into allowing you to use `this` before `super` anyway (or
to skip the `super` call altogether). This workaround only works when targeting
ES5 or earlier, depends on the implementation details of Babel and TypeScript,
and uses `Function.prototype.toString`, `eval`, and an `if (false)` conditional,
so it's best seen as an ugly hack that you should remove as soon as you can.

### Example

#### CoffeeScript
```coffee
class FriendlyPerson extends Person
  handleGreeting: =>
    @respond('Hello!')
    return
```

#### JavaScript after decaffeinate
```js
class FriendlyPerson extends Person {
  constructor(...args) {
    {
      // Hack: trick babel into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { this; }).toString();
      let thisName = thisFn.slice(thisFn.indexOf('{') + 1, thisFn.indexOf(';')).trim();
      eval(`${thisName} = this;`);
    }
    this.handleGreeting = this.handleGreeting.bind(this);
    super(...args);
  }

  handleGreeting() {
    this.respond('Hello!');
  }
}
```

#### Cleaner JavaScript (may not be equivalent)
```js
class FriendlyPerson extends Person {
  constructor(...args) {
    super(...args);
    this.handleGreeting = this.handleGreeting.bind(this);
  }

  handleGreeting() {
    this.respond('Hello!');
  }
}
```

### How to address

First, remove the self-contained workaround code block from the top of the
constructor. This will cause the code to crash (or not compile).

In many cases, it is safe to simply move the `this` usage after the `super`
call. If no `super` call was present, you should instead add a `super` call
before all `this` usages. However, you should watch out for any work that is
done during the super call and make sure that it is ok for the class fields to
not be assigned yet. In some frameworks like Backbone, the `super` call does
significant work, and you may need to rewrite some of your code to ensure that
method bindings and field assignments are done before they are used.

If you prefer, you can run decaffeinate with
`--disable-babel-constructor-workaround` or `--disallow-invalid-constructors` to
avoid generating the workaround code.

# DS1XX: Common cleanup tasks

## DS101: Remove unnecessary use of `Array.from`

### Overview

CoffeeScript has various operations, such as `for-in`, `in`, array
destructuring, and array spread, which need to iterate through an array. All of
these operations are designed to work with
[array-like objects](http://2ality.com/2013/05/quirk-array-like-objects.html).
JavaScript does things differently: ES2015 introduced the
[iterable protocol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols),
and JS `for-of` loops, destructuring, and array spread all require the target to
be iterable. decaffeinate also produces code using array methods like `map`,
`filter`, and `includes`.

In *most* cases in real-world code, these array operations are done on regular
JavaScript arrays (which are both array-like and iterable), but some values like
strings, jQuery collections, FileList, and NodeList are array-like but are
either not iterable or do not contain all array methods. To correctly handle
cases like these, decaffeinate uses
[Array.from](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from)
in many array operations to convert the value to an actual array if necessary.

### Example

#### CoffeeScript
```coffee
for lion in lions
  lion.roar()
[firstPlaceWinner] = raceWinners
if today in holidays
  celebrate()
eat(avocados...)
```

#### JavaScript after decaffeinate
```js
for (let lion of Array.from(lions)) {
  lion.roar();
}
let [firstPlaceWinner] = Array.from(raceWinners);
if (Array.from(holidays).includes(today)) {
  celebrate();
}
eat(...Array.from(avocados || []));
```

#### Cleaner JavaScript (may not be equivalent)
```js
for (let lion of lions) {
  lion.roar();
}
let [firstPlaceWinner] = raceWinners;
if (holidays.includes(today)) {
  celebrate();
}
eat(...avocados);
```

### How to address

Whenever code generated by decaffeinate uses `Array.from`, you should read the
code to understand what kind of value it is. In most cases, it will be a plain
array and you can safely remove `Array.from`. If it is not a plain array, you
should do more digging into the best way to properly convert the code. In some
cases, `Array.from` will still be the cleanest approach, and in other cases,
it's better to rethink the code.

Remember to watch out for browser compatibility issues! For example, as of this
writing, [FileList](https://developer.mozilla.org/en-US/docs/Web/API/FileList)
implements the ES2015 iterable protocol in Chrome and Firefox, but not in
IE, Edge, or Safari.

Note that the `--loose-for-expressions`, `--loose-for-of`, and
`--loose-includes` options tell decaffeinate to skip `Array.from` in some
situations.

## DS102: Remove unnecessary code created because of implicit returns

### Overview

CoffeeScript's behavior is that functions always implicitly return their last
statement. That means that the last statement is treated as an expression (for
example, a loop evaluates to an array) and is used as the return value of the
function. JavaScript does not have this implicit return behavior, so
decaffeinate needs to add a `return` statement and sometimes significantly
change the code by converting it to an expression. In many cases, this implicit
return behavior is unintentional and it's better for the function to simply have
no return value, but decaffeinate has no way of knowing whether the return value
is actually used, so it always mimics CoffeeScript's behavior.

### Example

#### CoffeeScript
```coffee
greetFriends = (people) ->
  for person in people
    if person.isFriendly()
      person.greet()
```

#### JavaScript after decaffeinate
```js
let greetFriends = people =>
  (() => {
    let result = [];
    for (let person of Array.from(people)) {
      if (person.isFriendly()) {
        result.push(person.greet());
      } else {
        result.push(undefined);
      }
    }
    return result;
  })()
;
```

#### Cleaner JavaScript (may not be equivalent)
```js
function greetFriends(people) {
  for (const person of people) {
    if (person.isFriendly()) {
      person.greet();
    }
  }
}
```

### How to address

After converting your code to JavaScript, look at the end of each function and
make sure it still makes sense for it to return a value. If not, adjust the code
to no longer have a return value, which may include converting a loop back from
expression form to statement form. Note that in large codebases, some code may
accidentally be relying on an unintentional implicit return value, so you should
be careful to check all usages to make sure the return value is actually never
used.

Alternatively, you can try to add *explicit* returns to your code before running
it through decaffeinate. If a function has `return` as its last statement, then
decaffeinate will make the function return no value and remove the `return` from
the JavaScript code since it isn't necessary. One way to detect and fix implicit
returns is to run the custom CoffeeLint rule
[coffeelint-no-implicit-returns](https://github.com/saifelse/coffeelint-no-implicit-returns)
on your code and change each function to either explicitly return its last
statement or to have an empty `return` at the end.

## DS103: Rewrite code to no longer use `__guard__`

### Overview

CoffeeScript "soak" operations, like `a?.b`, `c?[d]`, and `f?()`, have no
obvious equivalent in JavaScript, especially for complex cases. In simple cases,
decaffeinate converts `a?.b` to `a ? a.b : undefined`, but in more complex cases
this is not possible. Instead, decaffeinate generates a `__guard__` function (or
another function with a similar name) and uses nested calls and arrow functions
to implement the conditional evaluation behavior.

### Example

#### CoffeeScript
```coffee
cleanUp = (apartment) ->
  apartment?.getBathroom()?.shower.scrub()
  return
```

#### JavaScript after decaffeinate
```js
let cleanUp = function(apartment) {
  __guard__(apartment != null ? apartment.getBathroom() : undefined, x => x.shower.scrub());
};
function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
```

#### Cleaner JavaScript (may not be equivalent)
```js
function cleanUp(apartment) {
  const bathroom = apartment && apartment.getBathroom();
  const shower = bathroom && bathroom.shower;
  if (shower) {
    shower.scrub();
  }
}
```

### How to address

In most cases, it's best to find all uses of `__guard__`, look at the original
CoffeeScript, and manually translate the code to JavaScript. It often is also
cleaner to remove uses of `a ? a.b : undefined` with `a && a.b`, although keep
in mind that these are not equivalent if `a` could be a boolean, number, or
string.

In plain JavaScript, usually the cleanest approach is `&&`, sometimes combined
with intermediate variables. Some external libraries also help:

* [_.get](https://lodash.com/docs/4.17.4#get) from Lodash provides a similar
  (although less powerful) mechanism for safe nested access.
* Facebook has an open source project called [idx](https://github.com/facebookincubator/idx)
  that uses exceptions to implement safe nested access in plain JS and includes
  a Babel transform to translate the code to not use exceptions. See more
  information in the
  [announcement blog post](https://facebook.github.io/react-native/blog/2017/03/13/idx-the-existential-function.html).
* There is a language proposal called
  [Optional Chaining for JavaScript](https://github.com/tc39/proposal-optional-chaining)
  that adds a `?.` operator in JavaScript. As of this writing, the proposal is
  in relatively early stages, but has a
  [Babel plugin](https://github.com/babel/babel/tree/7.0/packages/babel-plugin-transform-optional-chaining)
  that can enable the current experimental behavior.

## DS104: Avoid inline assignments

### Overview

In various situations, decaffeinate needs to store an expression to a variable,
e.g. so that a function can be called once and the result used twice. To
preserve evaluation order and simplify the implementation, it usually generates
an assignment within an expression. This is correct, but can make the code hard
to read, and the variable name is auto-generated by decaffeinate.

### Example

#### CoffeeScript
```coffee
accounts[getAccountId()] //= splitFactor
```

#### JavaScript after decaffeinate
```js
let name;
accounts[name = getAccountId()] = Math.floor(accounts[name] / splitFactor);
```

#### Cleaner JavaScript
```js
const accountId = getAccountId();
accounts[accountId] = Math.floor(accounts[accountId] / splitFactor);
```

### How to address

In most cases, an inline assignment can simply be pulled out into a variable
initializer before the code that uses it. Keep in mind that in some situations,
this may change the evaluation order of function calls. You should also revisit
the names of any variables that were auto-generated.

## DS105: Use default params and defaults within assignments when possible

### Overview

Default parameters and defaults within assignments behave slightly differently
between CoffeeScript and JavaScript: in CoffeeScript, the default value is used
if the provided value is `null` or `undefined`, while in JavaScript, the default
value is only used if the provided value is `undefined`. This subtle difference
means decaffeinate can't safely convert CoffeeScript default values to
JavaScript default values, so it re-implements them with CoffeeScript behavior
instead.

### Example

#### CoffeeScript
```coffee
guessPosition = (pos = 0) ->
  {grid = []} = board
  if grid[pos] == 'ship'
    return 'You sunk my battleship.'
  else
    return 'Miss.'
```

#### JavaScript after decaffeinate
```js
let guessPosition = function(pos) {
  if (pos == null) { pos = 0; }
  let val = board.grid, grid = val != null ? val : [];
  if (grid[pos] === 'ship') {
    return 'You sunk my battleship.';
  } else {
    return 'Miss.';
  }
};
```

#### Cleaner JavaScript (may not be equivalent)
```js
function guessPosition(pos = 0) {
  const {grid = []} = board;
  if (grid[pos] === 'ship') {
    return 'You sunk my battleship.';
  } else {
    return 'Miss.';
  }
}
```

### How to address

For each function where you want to use default params, look at all of its
usages and determine if the specified value can ever be `null` (as opposed to
`undefined`). For example, it might be explicitly passed as `null`, or it might
be passed as an object property that can sometimes be null. If the specified
value can never be null, it's safe to change the JS code to use default params,
and the same strategy can be used for defaults within complex assignments.

Note that you can use the `--loose-default-params` option if you want
decaffeinate to automatically use default params in the generated code.

# DS2XX: Other cleanup tasks

## DS201: Simplify complex destructure assignments

### Overview

Nested destructure operations can in some cases be converted safely to
JavaScript as a destructure operation, but in some complex cases, JavaScript
assignment syntax is incorrect or not flexible enough:
* Array destructures.
* Intermediate expansion/rest nodes (`...` in the middle of an array destructure).
* Default values.

In these cases, decaffeinate reimplements the more straightforward algorithm
using repeated assignments.

### Example

#### CoffeeScript
```coffee
{left: {right: {left: {left: {right: [firstValue, ..., lastValue]}}}}} = tree;
```

#### JavaScript after decaffeinate
```js
let obj = tree.left,
  obj1 = obj.right,
  obj2 = obj1.left,
  obj3 = obj2.left,
  array = obj3.right,
  firstValue = array[0],
  lastValue = array[array.length - 1];
```

#### Cleaner JavaScript
```js
const {left: {right: {left: {left: {right: values}}}}} = tree;
const firstValue = values[0];
const lastValue = values[values.length - 1];
```

### How to address

In most cases, some destructure operations can still be done to replace the
repeated assignments, and often the original destructure form works if you know
that `Array.from` or strictly-equivalent default values are unnecessary.

## DS202: Simplify dynamic range loops

### Overview

Ranges in CoffeeScript have a direction, either up or down, depending on whether
the range start is greater than or less than the range end. In some cases,
decaffeinate doesn't know the direction of the range, so it needs to generate
code that decides at runtime which direction to iterate, which can make loops
much more verbose than they need to be.

### Example

#### CoffeeScript
```coffee
for guess in [firstGuess..lastGuess]
  makeGuess(guess)
```

#### JavaScript after decaffeinate
```js
for (let guess = firstGuess, end = lastGuess, asc = firstGuess <= end; asc ? guess <= end : guess >= end; asc ? guess++ : guess--) {
  makeGuess(guess);
}
```

#### Cleaner JavaScript (may not be equivalent)
```js
for (let guess = firstGuess; guess <= lastGuess; guess++) {
  makeGuess(guess);
}
```

### How to address

In most cases, a loop will either always loop up or always loop down, and the
direction is clear from the code, so you can rewrite the loop in the more
straightforward way.

## DS203: Remove `|| {}` from converted for-own loops

### Overview

CoffeeScript's `for own a of b` syntax allows iterating over `null` and
`undefined`, so decaffeinate needs to replicate this behavior. The simplest way
in JavaScript to loop over an object's own properties is to iterate over
`Object.keys`, but unfortunately, this crashes on `null` and `undefined`, so
decaffeinate inserts `|| {}` to handle that case.

### Example

#### CoffeeScript
```coffee
for own name of teamMembers
  console.log "Great work, #{name}!"
```

#### JavaScript after decaffeinate
```js
for (let name of Object.keys(teamMembers || {})) {
  console.log(`Great work, ${name}!`);
}
```

#### Cleaner JavaScript (may not be equivalent)
```js
for (let name of Object.keys(teamMembers)) {
  console.log(`Great work, ${name}!`);
}
```

### How to address

Double-check that you'll never iterate over `null` or `undefined` (this is rare,
but does occasionally come up), and if so, remove the `|| {}`.

## DS204: Change `includes` calls to have a more natural evaluation order

### Overview

CoffeeScript converts `a in b` to `b.includes(a)`. Since the order of `a` and
`b` are switched, it can cause subtle issues if they are function calls where
the order of evaluation matters, or if one is a function call that might affect
the result of the other. To be safe, in complex cases, decaffeinate saves the
left-hand side to a variable that gets evaluated first.

### Example

#### CoffeeScript
```coffee
if getLime() in getCoconut()
  drinkThemBoth()
```

#### JavaScript after decaffeinate
```js
let needle;
if ((needle = getLime(), Array.from(getCoconut()).includes(needle))) {
  drinkThemBoth();
}
```

#### Cleaner JavaScript (may not be equivalent)
```js
if (getCoconut().includes(getLime())) {
  drinkThemBoth();
}
```

### How to address

Double-check that the evaluation order doesn't matter and that neither side has
a side-effect that would affect the result of the other side. If so, it's safe
to change the code back to use `.includes` without an intermediate assignment.

## DS205: Consider reworking code to avoid use of IIFEs

### Overview

CoffeeScript allows most statements (e.g. `if`, `switch`, `for`, and `while`) to
be treated as expressions. In complex cases, decaffeinate handles this by
creating an inline function and then immediately calling it (also known as an
IIFE). This works, but sometimes results in JavaScript code that is confusing to
read.

### Example

#### CoffeeScript
```coffee
eat(switch desiredFlavor()
  when 'sweet'
    'ice cream'
  when 'savory'
    'grilled cheese'
  else
    'water')
```

#### JavaScript after decaffeinate
```js
eat((() => { switch (desiredFlavor()) {
  case 'sweet':
    return 'ice cream';
  case 'savory':
    return 'grilled cheese';
  default:
    return 'water';
} })());
```

#### Cleaner JavaScript
```js
switch (desiredFlavor()) {
  case 'sweet':
    eat('ice cream');
    break;
  case 'savory':
    eat('grilled cheese');
    break;
  default:
    eat('water');
}
```

### How to address

When you see an IIFE generated by decaffeinate, think if there's a way to rework
the code to be more natural. IIFEs aren't always bad, but often times there's a
cleaner alternative.

## DS206: Consider reworking classes to avoid `initClass`

### Overview

CoffeeScript allows arbitrary code within class bodies. Variables can be
assigned in a special class scope, prototype and class fields can be assigned,
methods can be conditionally defined, etc. JavaScript only allows methods
(static or non-static) in a class body, so in complex cases, decaffeinate
creates a static method called `initClass` that runs all of the other class body
code.

### Example

#### CoffeeScript
```coffee
class Circle
  PI = 3.14159265358979
  radius: 1
  setRadius: (@radius) ->
  getArea: ->
    PI * @radius * @radius
```

#### JavaScript after decaffeinate
```js
var Circle = (function() {
  let PI = undefined;
  Circle = class Circle {
    static initClass() {
      PI = 3.14159265358979;
      this.prototype.radius = 1;
    }
    setRadius(radius) {
      this.radius = radius;
    }
    getArea() {
      return PI * this.radius * this.radius;
    }
  };
  Circle.initClass();
  return Circle;
})();
```

#### Cleaner JavaScript (may not be equivalent)
```js
const PI = 3.14159265358979;
class Circle {
  constructor() {
    this.radius = 1;
  }
  setRadius(radius) {
    this.radius = radius;
  }
  getArea() {
    return PI * this.radius * this.radius;
  }
}
```

### How to address

Many use cases of code within class bodies can be replaced by other mechanisms:
* Constants used within the class can usually be pulled out as external
  constants.
* Nested classes can be pulled out into multiple classes at the top level.
* Prototype field assignments can often (but not always) be replaced by an
  assignment in the constructor. Note that assigning in the constructor creates
  a property *on the instance*, while assigning on the prototype creates a
  single shared property *used by all instances*. The
  [class fields](https://github.com/tc39/proposal-class-fields) language
  proposal adds a new syntax equivalent to assigning within the constructor, so
  it's not exactly the same as CoffeeScript class fields, but behaves similarly.

In other cases, it still makes sense to modify the class constructor or
prototype, in which case it may be fine to keep `initClass`.

## DS207: Consider shorter variations of null checks

### Overview

CoffeeScript has several operators that make it easy to check whether a value is
`null` or `undefined`. In JavaScript this can be done using `a != null`, but
often it is preferable to simply use the value as a boolean.

### Example

#### CoffeeScript
```coffee
if currentUser()?
  sendMessage(customMessage() ? 'Hello')
```

#### JavaScript after decaffeinate
```js
if (currentUser() != null) {
  let left;
  sendMessage((left = customMessage()) != null ? left : 'Hello');
}
```

#### Cleaner JavaScript (may not be equivalent)
```js
if (currentUser()) {
  sendMessage(customMessage() || 'Hello');
}
```

### How to address

Depending on your preferred code style, you may want to get rid of `!= null`
when a boolean coercion would work. Regardless, keep in mind that if the value
might be `false`, `''`, `0`, or `NaN`, then a boolean coercion may not work as
expected.

## DS208: Avoid top-level `this`

### Overview

Top-level `this` in JavaScript can mean several things, depending on context:
* In the browser, it refers to `window`.
* In Node.js, it refers to `module.exports`.
* In JS modules, it is never defined.

decaffeinate is unopinionated and produces JavaScript code that still uses
`this` at the top level, but Babel converts all top-level `this` usages to
`undefined` to implement the behavior for JS modules. Generally, new code should
avoid using top-level `this`, and instead use a more explicit value.

### How to address

Go through your code and change top-level `this` usages to either `window` or
`exports`, as applicable.

If you're running in Node.js and you want top-level `this` to work anyway, one
approach is to use the `top-level-this-to-exports.js` jscodeshift script
provided by [bulk-decaffeinate](https://github.com/decaffeinate/bulk-decaffeinate).

## DS209: Avoid top-level `return`

### Overview

Some module implementations (e.g. Node.js's module system) work by taking an
entire file and wrapping the contents it in a function which gets called. This
means that a `return` statement at the top level of a file body will stop
execution of the file at that point. Top-level returns are considered a syntax
error by the spec and Babel refuses to compile them, so they are generally
considered bad practice.

### How to address

Avoid top-level returns by rewriting your code to use some alternate form of
control flow.

If you're using Babel, you can instruct it to to allow top-level returns anyway
by adding a line like `"parserOpts": {"allowReturnOutsideFunction": true}` to
your config.

# DS3XX: General considerations

## DS301: Make sure your code works in strict mode

### Overview

JavaScript modules always run in strict mode, so Babel always adds "use strict"
to your code. CoffeeScript does not add "use strict", so in some situations,
converting a codebase from CoffeeScript to Babel causes errors due to strict
mode.

### How to address

See the [strict mode docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode)
for full information on strict mode. For example, CoffeeScript code might use
`arguments.callee` or assign to a non-writable property, both of which crash in
strict mode.

If you're using Babel and want to disable strict mode, there is a plugin called
[babel-plugin-transform-remove-strict-mode](https://github.com/genify/babel-plugin-transform-remove-strict-mode)
that lets you do that.

## DS302: Make sure your build system handles `Array.prototype.includes`

### Overview

The `Array.prototype.includes` function is part of ES2016. This means that it is
officially part of the language, but not available in all browsers/runtimes, and
unlike most syntax features, it can't be transpiled. decaffeinate changes
`a in b` to `b.includes(a)`, so it requires `includes`.

### How to address

You can usually use [babel-polyfill](https://babeljs.io/docs/usage/polyfill/) or
similar to add `includes` to the global `Array.prototype`.

If you would rather not support `Array.prototype.includes` (e.g. in library
code), you can pass the `--no-array-includes` option to decaffeinate to have it
produce an `__in__` helper instead. You will most likely want to replace
`__in__` as a cleanup step.

## DS303: Use a formatter like ESLint or Prettier

### Overview

decaffeinate makes an attempt at preserving formatting and making the output
look nice, but it isn't perfect, and in some situations, decaffeinate puts less
focus on a formatting or style issue if it can be automatically fixed by ESLint.
For example, decaffeinate is inconsistent about whether or not to use parens
around the parameter for single-parameter arrow functions, and fixing that is
low-priority since ESLint is able to either add or remove parens to match the
desired code style.

### How to address

Investigate formatters like [ESLint](http://eslint.org/) and
[Prettier](https://prettier.io/), find one that works for you, and run it after
converting code to JavaScript.

Note that [bulk-decaffeinate](https://github.com/decaffeinate/bulk-decaffeinate)
expects an ESLint config and automatically runs `eslint --fix` on all files.

## DS304: Consider configuring decaffeinate to convert to JS modules

### Overview

In most situations, you can and should use `import`/`export` syntax in new
JavaScript code. Automatically converting CoffeeScript code to this syntax can
be error-prone, so decaffeinate skips this step by default, but you can opt into
the behavior using the `--use-js-modules` option. One challenge with this
approach is the decaffeinate cannot accurately match named imports to named
exports across files, so some import statements will be invalid.

### How to address

The most straightforward way to do this is to use
[bulk-decaffeinate](https://github.com/decaffeinate/bulk-decaffeinate) and the
`--use-js-modules` option there. That option will instruct decaffeinate to use
JS modules and also run a follow-up transform that fixes imports across the
codebase to be named or default imports as necessary.

You may also want to consider the `--loose-js-modules` option, which produces
better-looking exports by using named exports when possible, but is more
fragile. For example, some types of code that dynamically produce exports will
not be converted correctly, and mocking/stubbing libraries may stop working.

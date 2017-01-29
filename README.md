# decaffeinate [![Build Status](https://travis-ci.org/decaffeinate/decaffeinate.svg?branch=master)](https://travis-ci.org/decaffeinate/decaffeinate) [![npm](https://img.shields.io/npm/v/decaffeinate.svg)](https://www.npmjs.com/package/decaffeinate)

Goodbye CoffeeScript, hello JavaScript!

JavaScript is the future, in part thanks to CoffeeScript. Now that it has served
its purpose, it's time to move on. Convert your CoffeeScript source to modern
JavaScript with decaffeinate.

## Installation and usage

```
$ npm install -g decaffeinate
$ decaffeinate input.coffee
input.coffee → input.js
```

Alternatively, paste code into the online [repl] to immediately see the output.

For real-world use cases, you'll likely want to spend some time understanding
the different options and nuances of the decaffeinate tool. You'll also likely
want to run decaffeinate using the [bulk-decaffeinate] wrapper tool, or write
your own wrapper script. See the [Conversion Guide][conversion-guide] for more
information and advice on running decaffeinate on real-world code.

## Status

**Mostly complete.** The project has been used to convert tens of thousands of
lines of production code, and can be relied upon for production use, but no
guarantees are made. For small projects like [hubot] and [autoprefixer],
decaffeinate can convert all code to JavaScript with all tests passing. For
larger projects, there may be some files that fail to convert or cases where the
generated JS has correctness issues.

Check the [issues] page for outstanding bugs and incomplete features. And, of
course, you're welcome to file issues for any problems you run into.

## Goals

* Fully automated conversion of the CoffeeScript language to modern JavaScript.
* Preserve whitespace, formatting, and comments as much as possible to allow
  a full one-time conversion of your CoffeeScript source code.
* Focus on correctness as the first priority, with some options to generate
  nicer code at the expense of 100% correctness.
* Provide helpful error messages when it encounters an unsupported language
  construct.

## Options

* `--keep-commonjs`: Do not convert `require` and `module.exports` to `import`
  and `export`.
* `--prefer-const`: Use `const` when possible in output code.
* `--loose-default-params`: Convert CS default params to JS default params.
* `--loose-for-expressions`: Do not wrap expression loop targets in `Array.from`.
* `--loose-for-of`: Do not wrap JS `for...of` loop targets in `Array.from`.
* `--loose-includes`: Do not wrap in `Array.from` when converting `in` to `includes`.
* `--allow-invalid-constructors`: Don't error when constructors use `this`
  before super or omit the `super` call in a subclass.
* `--enable-babel-constructor-workaround`: Use a hacky babel-specific workaround
  to allow `this` before `super` in constructors.

For more usage details, see the output of `decaffeinate --help`.

[repl]: http://decaffeinate-project.org/repl/
[bulk-decaffeinate]: https://github.com/decaffeinate/bulk-decaffeinate
[issues]: https://github.com/decaffeinate/decaffeinate/issues
[conversion-guide]: https://github.com/decaffeinate/decaffeinate/blob/master/docs/conversion-guide.md
[hubot]: https://github.com/github/hubot
[autoprefixer]: https://github.com/postcss/autoprefixer

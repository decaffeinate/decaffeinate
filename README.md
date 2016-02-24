# decaffeinate

CoffeeScript in, ES6 out.

JavaScript is the future, in part thanks to CoffeeScript. Now that it has served
its purpose, it's time to move on. Convert your CoffeeScript source to ES6
JavaScript with decaffeinate.

## Install

```
$ npm install -g decaffeinate
```

## Status

**Incomplete.** Check the [issues] page for outstanding bugs and incomplete
features. This project should not yet be relied upon for production use.

## Goals

* Fully automated conversion of the CoffeeScript language to JavaScript v6 (aka
  ES6).
* Preserve whitespace, formatting, and comments as much as possible to allow
  a full one-time conversion of your CoffeeScript source code.
* Provide helpful error messages when it encounters an unsupported language
  construct.

## Usage

See the output of `decaffeinate --help` after installing.

<hr>

[issues]: https://github.com/eventualbuddha/decaffeinate/issues

# decaffeinate

Move your CoffeeScript source to JavaScript using ES6 syntax.

## Install

```
$ npm install -g decaffeinate
```

## Status

**Incomplete.** Check the [issues] page for outstanding bugs and incomplete
features. This project should not yet be relied upon for production use.

## Goals

* Fully automated conversion of a subset<sup>[1]</sup> of the CoffeeScript
  language to JavaScript v6 (aka ES6).
* Preserve whitespace, formatting, and comments as much as possible to allow
  a full one-time conversion of your CoffeeScript source code.
* Provide helpful error messages when it encounters an unsupported language
  construct.

## Usage

See the output of `decaffeinate --help` after installing.

<hr>

<a name="1">1.</a> This project uses [CoffeeScriptRedux] which [deviates from
the official CoffeeScript][deviations] in some small ways that may affect your
project. In addition, not all language constructs are supported.

[1]: #1
[CoffeeScriptRedux]: https://github.com/michaelficarra/CoffeeScriptRedux
[deviations]: https://github.com/michaelficarra/CoffeeScriptRedux/wiki/Intentional-Deviations-From-jashkenas-coffee-script
[issues]: https://github.com/eventualbuddha/decaffeinate/issues

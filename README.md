# decaffeinate [![Build Status](https://travis-ci.org/decaffeinate/decaffeinate.svg?branch=master)](https://travis-ci.org/decaffeinate/decaffeinate)

CoffeeScript in, modern JavaScript out.
Convert your CoffeeScript source to modern JavaScript with decaffeinate.

## Install

```
$ npm install -g decaffeinate
```

See the [Conversion Guide][conversion-guide].

## Status

**Mostly complete.** Check the [issues] page for outstanding bugs and incomplete
features. This project may be relied upon for production use, but no guarantees
are made.

## Goals

* Fully automated conversion of the CoffeeScript language to modern JavaScript.
* Preserve whitespace, formatting, and comments as much as possible to allow
  a full one-time conversion of your CoffeeScript source code.
* Provide helpful error messages when it encounters an unsupported language
  construct.

## Usage

See the output of `decaffeinate --help` after installing.

[issues]: https://github.com/decaffeinate/decaffeinate/issues
[conversion-guide]: https://github.com/decaffeinate/decaffeinate/blob/master/docs/conversion-guide.md

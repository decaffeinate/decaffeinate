# Conversion Guide

This guide explains how to convert a project using `.coffee` files to
JavaScript using decaffeinate.

## Assumptions

This guide assumes a few things:

1. You have Node v4 or higher installed.
1. You have a project or set of files that currently compile using the
   official CoffeeScript compiler.
1. Your project is able to run ES2016 code. In particular, depending on what
   browsers/runtimes you need to support, you may need to set up Babel,
   including standard library polyfills like `Array.prototype.includes`.
1. You understand CoffeeScript, ES6, and the files being converted
   reasonably well.
1. You are using Linux, macOS, or a compatible OS and are comfortable
   using the command line. This may work on Windows with some
   adjustments.

Note that if you cannot or prefer not to install Node, or otherwise cannot or
prefer not to run commands on the command line, you can use the
[decaffeinate repl][repl] to do the conversion. This guide assumes that you are
using the command line.

[repl]: http://decaffeinate-project.org/repl/

## Getting Started

For this guide, we'll use the [bulk-decaffeinate] tool, but you can also run the
decaffeinate CLI directly if you prefer.

First, install all dependencies:

```
$ npm install -g bulk-decaffeinate decaffeinate eslint
```

Run decaffeinate on your codebase to see if any files have problems being
converted:

```
$ bulk-decaffeinate check
```

If there are any failures, a file called `decaffeinate-errors.log` will have
information about all failures.

[bulk-decaffeinate]: https://github.com/decaffeinate/bulk-decaffeinate

## Converting one file

Pick a file to convert first. Ideally it should be simple, and one that
you understand. Then run this:

```
$ bulk-decaffeinate convert -f path/to/your/file.coffee
```

This will generate three commits that convert that file to JavaScript.

In some cases, the conversion may fail. If this happens, you can often make a
modification to the CoffeeScript file so that decaffeinate can convert it. To
help with this, try pasting the code into the [repl] and tweaking the
CoffeeScript code until it can be converted. Also feel free to file a bug on the
[issues] page if you run into a bug.

[issues]: https://github.com/decaffeinate/decaffeinate/issues

### Sanity-check the JavaScript

Compare your new `.js` file against your `.coffee` file. Does the
conversion seem correct? Is there anything that was done incorrectly? Or
perhaps there are simply a few things that worked well in CoffeeScript
but don't work as well in JavaScript.

For a comprehensive list of things to keep in mind when looking over the
JavaScript output, see
[Cleanup suggestions after running decaffeinate](./correctness-issues.md).

### Run your tests

You have tests, right? The best way to ensure that the conversion went
smoothly is to run your test suite. Since decaffeinate generates code
with syntax from future versions of JavaScript, you may need to use a
tool like [babel][babel] to compile the code for use in the environments
you care about (i.e. Node, browsers, etc). If so, set up your build
system to convert the new `.js` file to runnable JavaScript.

Hopefully, running your tests will show that everything works as
expected. If not, consider [creating a new issue][new-issue] if you
believe that decaffeinate is generating incorrect code.

[babel]: https://babeljs.io/
[new-issue]: https://github.com/decaffeinate/decaffeinate/issues/new

## Converting a whole project

The bulk-decaffeinate tool allows you to pick how much code you convert at once.
See the [README][bulk-decaffeinate] for more details on configuration.

Before running decaffeinate all at once on your code, you should think about
what conversion strategy makes the most sense in your case. Here are some
questions you should ask yourself:

* How much risk can you accept? If your CoffeeScript project is a small side
  project that is not used in production, it may be fine to run decaffeinate all
  at once. If your project is used in production in an environment where bugs
  are costly, you'll likely want to spread out the conversion slowly over time.
  Also, you may prefer to use some of the `--loose` options if occasional bugs
  are acceptable in your case.
* How good is your test coverage? More tests means you can be more confident
  converting larger batches of code at once and enabling more `--loose` options.
* Are you happy with the style of the generated code? `bulk-decaffeinate`
  automatically runs `eslint --fix`, so one way to ensure style consistency in
  simple cases is to configure eslint for your preferred style. In more
  complicated cases, you may want to write custom code transforms for your use
  case. `bulk-decaffeinate` can be configured to run custom [jscodeshift]
  scripts as part of the conversion process.
* Are you already using JavaScript for some files? If not, you may want to avoid
  jumping in too quickly. Especially if you're working on a team, you may want
  to first think through JavaScript best practices for your codebase, so that
  your team can be consistent once your code is in JavaScript.
* Do you have buy-in from your team? If you need to convince others on your team
  that decaffeinate is a good idea, you may want to convert a small area of code
  as a proof of concept first.
* Why are you using decaffeinate? For example, if your goal is to simplify your
  build tooling, you may want to convert your codebase in an automated way
  without worrying as much about the resulting code style. If you want to avoid
  having to teach CoffeeScript to new team members, you may want to prioritize
  the most actively developed code and spend time manually fixing any style
  issues in the converted code.

[jscodeshift]: https://github.com/facebook/jscodeshift

## A note about file history

You may notice that [bulk-decaffeinate] generates multiple commits instead of
just one. In particular, it renames the file in one commit and changes the
contents in a separate commit. This allows git to properly track file history
across the conversion.

For example, once you've converted your file, you can run
`git log --follow -- path/to/file.js` and see the history of the `.coffee` file
too.

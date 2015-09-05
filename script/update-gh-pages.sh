#!/usr/bin/env bash

set -e

PATH="$(npm bin):$PATH"

# Build the browser version.
browserify -e lib/index.js -s decaffeinate -o decaffeinate.js

# Switch to gh-pages branch.
git fetch origin
git checkout gh-pages
git reset --hard origin/gh-pages

# Update the script in the gh-pages branch.
mv decaffeinate.js scripts/
git commit -av -m "Update decaffeinate.js."

# Go back to the master branch.
git checkout master

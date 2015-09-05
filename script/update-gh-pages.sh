#!/usr/bin/env bash

set -e

source $(dirname $0)/helpers.sh

# Build the browser version.
browserify -e lib/index.js -s decaffeinate -o decaffeinate.js

# Switch to gh-pages branch.
git fetch origin
git checkout gh-pages
git reset --hard origin/gh-pages || echo "No updates from server."

# Update the script in the gh-pages branch.
mv decaffeinate.js scripts/
if hasChanges; then
  git commit -av -m "Update decaffeinate.js."
  git push origin gh-pages
fi

# Go back to the master branch.
git checkout master

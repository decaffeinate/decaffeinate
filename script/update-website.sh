#!/usr/bin/env bash

set -e

if [ "$TRAVIS_PULL_REQUEST" != "false" ]; then
  echo "Refusing to update website on PR build."
  exit 0
fi

source $(dirname $0)/helpers.sh

configureGithubRemote

# Get the current version.
VERSION=$(./script/latest-version $(node -e 'console.log(require("./package.json")["name"])'))

# Build the browser version.
browserify -e dist/decaffeinate.js -s decaffeinate -o decaffeinate.js

CURRENT_REF=$(git rev-parse HEAD)

# Switch to gh-pages branch.
git fetch -f origin gh-pages:gh-pages
git reset --hard gh-pages

# Update the script in the gh-pages branch.
mv decaffeinate.js scripts/
perl -p -i -e "s/v\d+\.\d+\.\d+/v$VERSION/" repl/index.html
if hasChanges; then
  git commit -av -m "Update decaffeinate.js."
  git push origin HEAD:gh-pages
  surge --project .
fi

git reset --hard $CURRENT_REF

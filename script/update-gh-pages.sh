#!/usr/bin/env bash

set -e

if [ "$TRAVIS_BRANCH" != "master" ]; then
  echo "No GitHub pages update on the $TRAVIS_BRANCH branch."
  exit 0
fi

source $(dirname $0)/helpers.sh

configureGithubRemote

# Get the current version.
VERSION=$(./script/latest-version $(node -e 'console.log(require("./package.json")["name"])'))

# Build the browser version.
browserify -e dist/decaffeinate.js -s decaffeinate -o decaffeinate.js

# Switch to gh-pages branch.
git fetch -f origin gh-pages:gh-pages
git reset --hard gh-pages

# Update the script in the gh-pages branch.
mv decaffeinate.js scripts/
perl -p -i -e "s/v\d+\.\d+\.\d+/v$VERSION/" repl/index.html
if hasChanges; then
  git commit -av -m "Update decaffeinate.js."
  git push origin HEAD:gh-pages
fi

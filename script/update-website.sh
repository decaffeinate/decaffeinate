#!/usr/bin/env bash

set -e

COMMIT=true
FORCE=false

while [ $# -gt 0 ]; do
  case $1 in
    --no-commit)
      COMMIT=false
      ;;

    --force|-f)
      FORCE=true
      ;;
  esac

  shift
done


if [[ "${FORCE}" != "true" && "${TRAVIS_PULL_REQUEST}" != "false" ]]; then
  echo "Refusing to update website on PR build."
  exit 0
fi

source $(dirname $0)/helpers.sh

configureGithubRemote website decaffeinate/decaffeinate-project.org

# Get the current version.
VERSION=$(./script/latest-version $(node -e 'console.log(require("./package.json")["name"])'))

CURRENT_REF=$(git rev-parse HEAD)

# Switch to gh-pages branch.
git fetch -f website master:website-master
git reset --hard website-master

# Update decaffeinate in the website repo.
npm install --save-dev --save-exact decaffeinate@${VERSION}
if hasChanges; then
  if [ "${COMMIT}" == true ]; then
    git commit -av -m "chore: update to decaffeinate ${VERSION}"
    git push website HEAD:master
  else
    echo "Not committing because --no-commit was given:"
    git diff
  fi
fi

git reset --hard ${CURRENT_REF}

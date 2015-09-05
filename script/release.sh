#!/usr/bin/env bash

set -e

PATH="$(npm bin):$PATH"
RELEASE_TYPE=$1

usage() {
  echo "$(basename $0) (major | minor | patch)"
}

hasChanges() {
  if git diff-index --quiet HEAD --; then
    return 1
  else
    return 0
  fi
}

if hasChanges; then
  echo "error: there are uncommitted changes"
  exit 1
fi

case "$RELEASE_TYPE" in
  major|minor|patch)
    ;;

  -h|--help)
    usage
    exit 0
    ;;

  *)
    usage
    exit 1
    ;;
esac

npm test
mversion $RELEASE_TYPE -m
git push
git push --tags
npm publish
$(dirname $0)/update-gh-pages.sh

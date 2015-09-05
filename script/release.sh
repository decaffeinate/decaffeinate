#!/usr/bin/env bash

set -e

source $(dirname $0)/helpers.sh

RELEASE_TYPE=$1

usage() {
  echo "$(basename $0) (major | minor | patch)"
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

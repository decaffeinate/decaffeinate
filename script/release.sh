#!/usr/bin/env bash

set -e

source $(dirname $0)/helpers.sh

RELEASE_TYPE=
TAG=

usage() {
  echo "$(basename $0) (major | minor | patch) (--latest|--dev)"
}

if hasChanges; then
  echo "error: there are uncommitted changes"
  exit 1
fi

while [ -n "$1" ]; do
  case "$1" in
    major|minor|patch)
      RELEASE_TYPE=$1
      ;;

    -h|--help)
      usage
      exit 0
      ;;

    --latest)
      TAG=latest
      ;;

    --dev)
      TAG=dev
      ;;

    *)
      usage
      exit 1
      ;;
  esac
  shift
done

if [[ -z "$RELEASE_TYPE" || -z "$TAG" ]]; then
  usage
  exit 1
fi

npm test
mversion $RELEASE_TYPE -m
git push
git push --tags
npm publish --tag=$TAG
if [ "$TAG" == "latest" ]; then
  $(dirname $0)/update-gh-pages.sh
fi

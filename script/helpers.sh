PATH="$(npm bin):$PATH"

hasChanges() {
  git status >/dev/null # update the cache
  if git diff-index --quiet HEAD --; then
    return 1
  else
    return 0
  fi
}

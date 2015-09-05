PATH="$(npm bin):$PATH"

hasChanges() {
  if git diff-index --quiet HEAD --; then
    return 1
  else
    return 0
  fi
}

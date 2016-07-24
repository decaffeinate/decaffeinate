PATH="$(npm bin):$PATH"

hasChanges() {
  git status >/dev/null # update the cache
  if git diff-index --quiet HEAD --; then
    return 1
  else
    return 0
  fi
}

configureGithubRemote() {
  local remote=$1
  local project=$2
  if [ -n "$GH_TOKEN" ]; then
    git remote set-url "${remote}" "https://${GH_TOKEN}@github.com/${project}.git"
    git config user.name "Brian Donovan"
    git config user.email "me@brian-donovan.com"
  fi
}
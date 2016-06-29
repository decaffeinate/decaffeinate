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
  if [ -n "$GH_TOKEN" ]; then
    git remote set-url origin "https://$GH_TOKEN@github.com/decaffeinate/decaffeinate.git"
    git config user.name "Brian Donovan"
    git config user.email "me@brian-donovan.com"
  fi
}
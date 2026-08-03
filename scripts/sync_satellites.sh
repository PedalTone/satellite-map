#!/bin/zsh
set -eu

SCRIPT_DIR="${0:A:h}"
REPO_DIR="${SCRIPT_DIR:h}"
LOG_PREFIX="[satellite-sync]"

cd "$REPO_DIR"

if ! /usr/bin/git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  print -u2 "$LOG_PREFIX $REPO_DIR is not a Git repository"
  exit 1
fi

if ! /usr/bin/git remote get-url origin >/dev/null 2>&1; then
  print -u2 "$LOG_PREFIX Git remote 'origin' is not configured"
  exit 1
fi

/usr/bin/git add -- satellites.txt
if /usr/bin/git diff --cached --quiet -- satellites.txt; then
  exit 0
fi

/usr/bin/git commit -m "Update satellite list"
/usr/bin/git push origin HEAD:main
print "$LOG_PREFIX satellites.txt pushed successfully"

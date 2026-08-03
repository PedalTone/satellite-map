#!/bin/zsh
set -eu

AGENT_LABEL="com.personal.satellite-map-sync"
AGENT_FILE="$HOME/Library/LaunchAgents/$AGENT_LABEL.plist"

/bin/launchctl bootout "gui/$(/usr/bin/id -u)/$AGENT_LABEL" >/dev/null 2>&1 || true
if [[ -f "$AGENT_FILE" ]]; then
  /bin/rm "$AGENT_FILE"
fi

print "Satellite-map auto-sync removed."

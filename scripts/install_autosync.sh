#!/bin/zsh
set -eu

SCRIPT_DIR="${0:A:h}"
REPO_DIR="${SCRIPT_DIR:h}"
SYNC_SCRIPT="$SCRIPT_DIR/sync_satellites.sh"
SATELLITE_FILE="$REPO_DIR/satellites.txt"
AGENT_LABEL="com.personal.satellite-map-sync"
AGENT_FILE="$HOME/Library/LaunchAgents/$AGENT_LABEL.plist"
LOG_FILE="$HOME/Library/Logs/satellite-map-sync.log"

if ! /usr/bin/git -C "$REPO_DIR" remote get-url origin >/dev/null 2>&1; then
  print -u2 "Configure the GitHub remote before installing auto-sync."
  print -u2 "Example: git remote add origin https://github.com/YOUR-NAME/YOUR-REPO.git"
  exit 1
fi

/bin/mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"
/bin/chmod +x "$SYNC_SCRIPT"

/bin/cat > "$AGENT_FILE" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$AGENT_LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>$SYNC_SCRIPT</string>
  </array>
  <key>WatchPaths</key>
  <array>
    <string>$SATELLITE_FILE</string>
  </array>
  <key>StandardOutPath</key>
  <string>$LOG_FILE</string>
  <key>StandardErrorPath</key>
  <string>$LOG_FILE</string>
  <key>ProcessType</key>
  <string>Background</string>
</dict>
</plist>
EOF

/usr/bin/plutil -lint "$AGENT_FILE"
/bin/launchctl bootout "gui/$(/usr/bin/id -u)/$AGENT_LABEL" >/dev/null 2>&1 || true
/bin/launchctl bootstrap "gui/$(/usr/bin/id -u)" "$AGENT_FILE"

print "Auto-sync installed. Saving satellites.txt will now push it to GitHub."
print "Log: $LOG_FILE"

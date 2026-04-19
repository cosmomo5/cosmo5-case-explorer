#!/usr/bin/env bash
# Playwright MCP launcher — Direction A (CDP attach to Windows Chrome).
# Runs as the .mcp.json "command". Health-checks the Windows-side Chrome
# debug endpoint, relaunches Chrome via powershell.exe interop if dead,
# then execs the @playwright/mcp Node CLI in --cdp-endpoint mode so MCP
# stdio flows transparently to the parent (Claude Code).
#
# Architecture: see .planning/DECISIONS.md (2026-04-19 Playwright topology).
# Operational runbook: see CLAUDE.md "Playwright MCP" section.

set -euo pipefail

CDP_PORT="${PLAYWRIGHT_CDP_PORT:-9222}"
CDP_URL="http://localhost:${CDP_PORT}"
CHROME_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'
PROFILE_DIR='C:\Tmp\PlaywrightProfile'
# node.exe expects Windows-native paths (POSIX /mnt/c/... gets mangled to C:\mnt\c\...).
MCP_CLI='C:\nvm4w\nodejs\node_modules\@playwright\mcp\cli.js'
NODE_BIN='/mnt/c/nvm4w/nodejs/node.exe'
PS='/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe'

log() { printf '[playwright-mcp-cdp] %s\n' "$*" >&2; }

chrome_alive() {
  curl -fsS --max-time 2 "${CDP_URL}/json/version" >/dev/null 2>&1
}

launch_chrome() {
  log "Chrome CDP not responding on ${CDP_URL}; launching via powershell.exe."
  "${PS}" -NoProfile -Command "
    New-Item -ItemType Directory -Path '${PROFILE_DIR}' -Force | Out-Null
    Start-Process -FilePath '${CHROME_PATH}' -ArgumentList '--remote-debugging-port=${CDP_PORT}', '--user-data-dir=${PROFILE_DIR}', '--no-first-run', '--no-default-browser-check', '--disable-features=ChromeWhatsNewUI', 'about:blank'
  " >&2
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    sleep 1
    if chrome_alive; then
      log "Chrome CDP up after relaunch."
      return 0
    fi
  done
  log "ERROR: Chrome failed to expose CDP within 10s. Check Windows side."
  return 1
}

if ! chrome_alive; then
  launch_chrome
fi

log "Attaching @playwright/mcp to ${CDP_URL}."
exec "${NODE_BIN}" "${MCP_CLI}" --cdp-endpoint "${CDP_URL}" "$@"

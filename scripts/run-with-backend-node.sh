#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
backend_node_version="$(tr -d '[:space:]' < "$project_root/backend/.nvmrc")"
current_node_major="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"

if [[ "$current_node_major" != "$backend_node_version" ]]; then
  nvm_script="${NVM_DIR:-${HOME:-}/.nvm}/nvm.sh"
  if [[ ! -s "$nvm_script" ]]; then
    echo "Backend requires Node $backend_node_version; nvm was not found at $nvm_script" >&2
    exit 1
  fi
  # nvm is intentionally loaded only inside this subprocess.
  source "$nvm_script"
  nvm use --silent "$backend_node_version" >/dev/null
fi

cd "$project_root"
exec "$@"

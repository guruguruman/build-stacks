#!/usr/bin/env bash
set -euo pipefail
umask 077

TOTAL_STAGES=1
CURRENT_STAGE=0

say() { printf '%s\n' "$*"; }
stage() { CURRENT_STAGE=$((CURRENT_STAGE + 1)); printf '\n[%s/%s] %s\n' "$CURRENT_STAGE" "$TOTAL_STAGES" "$1"; }
confirm() { local answer; read -r -p "$1 [y/N] " answer; [[ "$answer" == "y" || "$answer" == "Y" ]]; }
ask() { local __name="$1" prompt="$2" value; [[ "$__name" =~ ^[A-Z][A-Z0-9_]*$ ]] || return 2; read -r -p "$prompt: " value; printf -v "$__name" '%s' "$value"; }
ask_secret() { local __name="$1" prompt="$2" value; [[ "$__name" =~ ^[A-Z][A-Z0-9_]*$ ]] || return 2; read -r -s -p "$prompt: " value; printf '\n'; printf -v "$__name" '%s' "$value"; }
open_url() { local url="$1"; case "$(uname -s)" in Darwin) open "$url" ;; Linux) command -v xdg-open >/dev/null && xdg-open "$url" ;; *) say "Open: $url" ;; esac; }
set_gh_secret() { local name="$1" value="$2"; [[ "$name" =~ ^[A-Z][A-Z0-9_]*$ ]] || return 2; command -v gh >/dev/null || return 127; printf '%s' "$value" | gh secret set "$name"; }
write_private_env() {
  local file="$1" name="$2" value="$3" directory temporary
  [[ "$name" =~ ^[A-Z][A-Z0-9_]*$ ]] || return 2
  [[ ! -L "$file" ]] || { say "Refusing symlink destination: $file" >&2; return 2; }
  [[ ! -e "$file" || -f "$file" ]] || { say "Refusing non-regular destination: $file" >&2; return 2; }
  [[ "$value" != *$'\n'* && "$value" != *$'\r'* ]] || { say "Refusing multiline dotenv value" >&2; return 3; }
  [[ "$value" =~ ^[A-Za-z0-9_./:@%+=,-]*$ ]] || { say "Refusing value that lacks a verified portable dotenv representation" >&2; return 3; }
  directory=$(dirname "$file")
  mkdir -p "$directory"
  temporary=$(mktemp "${file}.tmp.XXXXXX")
  chmod 600 "$temporary"
  if [[ -f "$file" ]] && ! awk -v key="$name" '$0 !~ ("^" key "=")' "$file" > "$temporary"; then
    rm -f "$temporary"
    return 4
  fi
  if ! printf '%s=%s\n' "$name" "$value" >> "$temporary"; then
    rm -f "$temporary"
    return 4
  fi
  if ! mv "$temporary" "$file"; then
    rm -f "$temporary"
    return 4
  fi
  chmod 600 "$file"
}

# STAGES: replace the example below; do not edit the helper library above.
stage "Example human-only step"
say "Replace this stage with verified instructions."
confirm "Continue?" || exit 1

say "Wizard complete."

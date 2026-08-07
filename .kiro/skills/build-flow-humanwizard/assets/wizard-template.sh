#!/usr/bin/env bash
set -euo pipefail

TOTAL_STAGES=1
CURRENT_STAGE=0

say() { printf '%s\n' "$*"; }
stage() { CURRENT_STAGE=$((CURRENT_STAGE + 1)); printf '\n[%s/%s] %s\n' "$CURRENT_STAGE" "$TOTAL_STAGES" "$1"; }
confirm() { local answer; read -r -p "$1 [y/N] " answer; [[ "$answer" == "y" || "$answer" == "Y" ]]; }
ask() { local __name="$1" prompt="$2" value; [[ "$__name" =~ ^[A-Z][A-Z0-9_]*$ ]] || return 2; read -r -p "$prompt: " value; printf -v "$__name" '%s' "$value"; }
ask_secret() { local __name="$1" prompt="$2" value; [[ "$__name" =~ ^[A-Z][A-Z0-9_]*$ ]] || return 2; read -r -s -p "$prompt: " value; printf '\n'; printf -v "$__name" '%s' "$value"; }
open_url() { local url="$1"; case "$(uname -s)" in Darwin) open "$url" ;; Linux) command -v xdg-open >/dev/null && xdg-open "$url" ;; *) say "Open: $url" ;; esac; }
write_env() { local file="$1" name="$2" value="$3"; [[ "$name" =~ ^[A-Z][A-Z0-9_]*$ ]] || return 2; touch "$file"; awk -v key="$name" '$0 !~ "^" key "="' "$file" > "$file.tmp"; printf '%s=%q\n' "$name" "$value" >> "$file.tmp"; mv "$file.tmp" "$file"; }

# STAGES: replace the example below; do not edit the helper library above.
stage "Example human-only step"
say "Replace this stage with verified instructions."
confirm "Continue?" || exit 1

say "Wizard complete."

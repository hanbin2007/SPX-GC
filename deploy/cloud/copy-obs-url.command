#!/bin/zsh
set -euo pipefail

url=$(/usr/bin/security find-generic-password -s OGraphicCloudSPXOBS -a renderer-url -w)
printf '%s' "$url" | /usr/bin/pbcopy
printf 'OBS Browser Source URL copied to clipboard.\n'

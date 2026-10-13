#!/usr/bin/env bash
# Converts the newest Playwright demo video into an optimized GIF (< 5 MB) at docs/demo.gif.
set -euo pipefail
cd "$(dirname "$0")/.."
VIDEO=$(ls -t frontend/e2e/.media/video/*.webm | head -1)
OUT=docs/demo.gif
PALETTE=$(mktemp -t palette).png
FPS=${FPS:-7}
WIDTH=${WIDTH:-880}
FILTERS="fps=${FPS},scale=${WIDTH}:-1:flags=lanczos"
ffmpeg -loglevel error -y -i "$VIDEO" -vf "${FILTERS},palettegen=max_colors=96:stats_mode=diff" "$PALETTE"
ffmpeg -loglevel error -y -i "$VIDEO" -i "$PALETTE" -lavfi "${FILTERS} [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" "$OUT"
SIZE=$(wc -c < "$OUT" | tr -d ' ')
echo "docs/demo.gif: $((SIZE / 1024)) KB from $(basename "$VIDEO")"
if [ "$SIZE" -ge 5000000 ]; then echo "GIF is larger than 5 MB – lower FPS/WIDTH" >&2; exit 1; fi

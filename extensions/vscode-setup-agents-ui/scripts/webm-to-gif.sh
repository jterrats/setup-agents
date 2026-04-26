#!/usr/bin/env bash
# Converts all .webm recordings in demo-recordings/ to optimized GIFs.
# Requires: ffmpeg
# Usage: bash scripts/webm-to-gif.sh

set -euo pipefail

RECORDINGS_DIR="demo-recordings"
OUTPUT_DIR="demo-gifs"
FPS=12
WIDTH=420

if ! command -v ffmpeg &>/dev/null; then
  echo "Error: ffmpeg is required. Install with: brew install ffmpeg"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

count=0
find "$RECORDINGS_DIR" -name '*.webm' -type f | while IFS= read -r webm; do
  basename_no_ext=$(basename "$webm" .webm)
  parent_dir=$(basename "$(dirname "$webm")")
  output_name="${parent_dir}--${basename_no_ext}"
  gif_path="$OUTPUT_DIR/${output_name}.gif"

  echo "Converting: $webm -> $gif_path"

  ffmpeg -y -i "$webm" \
    -vf "fps=${FPS},scale=${WIDTH}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" \
    -loop 0 "$gif_path" 2>/dev/null

  size=$(du -h "$gif_path" | cut -f1)
  echo "  -> $gif_path ($size)"
done

count=$(find "$RECORDINGS_DIR" -name '*.webm' -type f | wc -l | tr -d ' ')
if [ "$count" -eq 0 ]; then
  echo "No .webm files found in $RECORDINGS_DIR/"
  echo "Run: npx playwright test --config playwright.demo.config.ts"
  exit 1
fi

echo ""
echo "Done: $count GIF(s) converted to $OUTPUT_DIR/"

#!/bin/bash
# Unduh dependensi untuk simulator merge sort (di-inline ke single file HTML)
set -e
DIR=/home/z/my-project/scripts/sim/vendor
mkdir -p "$DIR"
cd "$DIR"

GSAP=https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist
for f in gsap.min.js MotionPathPlugin.min.js SplitText.min.js ScrambleTextPlugin.min.js CustomEase.min.js; do
  curl -sS --max-time 30 -o "$f" "$GSAP/$f"
  echo "$f: $(wc -c < "$f") bytes"
done

# Font: Space Grotesk 400/700 + JetBrains Mono 400/700 (subset latin) + subset simbol
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
mkdir -p fonts
fetch_css() {
  curl -sS --max-time 30 -A "$UA" "$1" -o "$2"
  echo "$2: $(wc -c < "$2") bytes"
}
fetch_css "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap" sg.css
fetch_css "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" jbm.css
fetch_css "https://fonts.googleapis.com/css2?family=JetBrains+Mono&text=%E2%89%A4%E2%86%92" jbm-sym.css
echo "DONE"

#!/bin/bash
# Generate simple colored square icons as placeholders
# These can be replaced with proper icons later

# 16x16 icon (purple/blue gradient square)
convert -size 16x16 gradient:'#667eea'-'#764ba2' \
  -gravity center \
  \( -size 12x12 xc:white -fill '#667eea' -draw "polygon 6,2 3,5 6,8 9,5" \) \
  -composite icon16.png 2>/dev/null

# 48x48 icon
convert -size 48x48 gradient:'#667eea'-'#764ba2' \
  -gravity center \
  \( -size 36x36 xc:white -fill '#667eea' -draw "polygon 18,6 9,15 18,24 27,15" \) \
  -composite icon48.png 2>/dev/null

# 128x128 icon
convert -size 128x128 gradient:'#667eea'-'#764ba2' \
  -gravity center \
  \( -size 96x96 xc:white -fill '#667eea' -draw "polygon 48,16 24,40 48,64 72,40" \) \
  -composite icon128.png 2>/dev/null

echo "Icons generated (if ImageMagick is installed)"
echo "If not installed, please open create-icons.html in a browser"

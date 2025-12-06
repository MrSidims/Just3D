#!/usr/bin/env python3
"""
Simple icon generator for the 3D Model Viewer extension.
Creates placeholder icons if PIL/Pillow is available.
"""

try:
    from PIL import Image, ImageDraw

    def create_icon(size):
        # Create image with gradient-like background
        img = Image.new('RGB', (size, size), color='#667eea')
        draw = ImageDraw.Draw(img)

        # Draw simple 3D cube representation
        scale = size / 128
        center_x, center_y = size // 2, size // 2

        # Draw a simple diamond shape to represent 3D
        points = [
            (center_x, center_y - int(30 * scale)),  # top
            (center_x - int(25 * scale), center_y),  # left
            (center_x, center_y + int(30 * scale)),  # bottom
            (center_x + int(25 * scale), center_y),  # right
        ]

        # Fill with white
        draw.polygon(points, fill='#ffffff', outline='#764ba2')

        # Add inner lines for 3D effect
        draw.line([points[0], points[2]], fill='#764ba2', width=max(1, int(2 * scale)))
        draw.line([points[1], points[3]], fill='#764ba2', width=max(1, int(2 * scale)))

        return img

    # Generate icons
    sizes = [16, 48, 128]
    for size in sizes:
        icon = create_icon(size)
        icon.save(f'icon{size}.png')
        print(f'Created icon{size}.png')

    print('\nIcons generated successfully!')

except ImportError:
    print('PIL/Pillow not installed.')
    print('Please install with: pip install Pillow')
    print('Or open create-icons.html in a web browser to generate icons manually.')

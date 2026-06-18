import sys
from PIL import Image

def process_image(input_path, output_path):
    try:
        img = Image.open(input_path).convert("RGBA")
        pix = img.load()
        width, height = img.size
        
        # Target background color sample (solid white)
        # Any pixel where R, G, B are all very close to 255 is background
        for x in range(width):
            for y in range(height):
                r, g, b, a = pix[x, y]
                
                # Check distance to pure white (255, 255, 255)
                dist = ((r - 255)**2 + (g - 255)**2 + (b - 255)**2)**0.5
                
                # If pixel is very close to white, make it transparent
                # Using a threshold of 10 is very safe for solid white background
                if dist < 12:
                    pix[x, y] = (0, 0, 0, 0)
                else:
                    # Keep pot graphics intact and ensure full opacity for the vases
                    if r < 250 or g < 250 or b < 250:
                        pix[x, y] = (r, g, b, 255)
                        
        img.save(output_path, "PNG")
        print("Success")
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    input_file = "C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\ed6d257c-8ed6-41c6-b5e3-6177fa78ee8a\\media__1781761978046.png"
    output_file = "C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\ed6d257c-8ed6-41c6-b5e3-6177fa78ee8a\\pots-transparent-v2.png"
    process_image(input_file, output_file)

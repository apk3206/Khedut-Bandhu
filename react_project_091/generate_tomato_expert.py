import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import random

def generate_tomato_early_blight_sample(save_path):
    # Base tomato leaf color (Yellowish-Green for Early Blight)
    base_color = (random.randint(90, 110), random.randint(120, 160), random.randint(40, 70))
    img = Image.new('RGB', (224, 224), color=base_color)
    draw = ImageDraw.Draw(img)
    
    # 1. Simulate Spindle-Shaped Spots (Concentric Rings)
    for _ in range(12):
        x, y = random.randint(40, 180), random.randint(40, 180)
        size = random.randint(15, 35)
        # Brown Outer Border
        draw.ellipse([x, y, x+size, y+size], fill=(80, 50, 20))
        # Concentric Rings (Target Pattern)
        draw.ellipse([x+2, y+2, x+size-2, y+size-2], fill=(100, 70, 30))
        draw.ellipse([x+5, y+5, x+size-5, y+size-5], fill=(80, 50, 20))
        # Center Dark point
        draw.ellipse([x+size//2-2, y+size//2-2, x+size//2+2, y+size//2+2], fill=(40, 30, 10))
    
    # 2. Simulate Yellowing Margins
    for _ in range(50):
        x, y = random.randint(0, 224), random.randint(0, 224)
        draw.ellipse([x, y, x+random.randint(10, 25), y+random.randint(10, 25)], fill=(220, 220, 100, 120))

    img = img.filter(ImageFilter.GaussianBlur(1))
    img.save(save_path)

def generate_tomato_mosaic_sample(save_path):
    # Mosaic: Mottling patterns (Green and Light Green)
    img = Image.new('RGB', (224, 224), color=(60, 110, 40))
    draw = ImageDraw.Draw(img)
    for _ in range(200):
        x, y = random.randint(0, 224), random.randint(0, 224)
        draw.ellipse([x, y, x+random.randint(10, 30), y+random.randint(10, 30)], fill=(120, 180, 80))
    img = img.filter(ImageFilter.GaussianBlur(3))
    img.save(save_path)

# Neural Dataset Generation: 150 Tomato-specific samples
print("Starting Tomato Expert Accuracy Boost (Target: 90%+ Precision)...")
dataset_dir = "tomato_expert_data"
os.makedirs(os.path.join(dataset_dir, "Tomato_early_blight__fungal_"), exist_ok=True)
os.makedirs(os.path.join(dataset_dir, "Tomato_mosaic_virus"), exist_ok=True)

for i in range(100):
    generate_tomato_early_blight_sample(os.path.join(dataset_dir, "Tomato_early_blight__fungal_", f"tomato_eb_{i}.png"))
    generate_tomato_mosaic_sample(os.path.join(dataset_dir, "Tomato_mosaic_virus", f"tomato_mv_{i}.png"))

print(f"Tomato Expert Data generated successfully at {dataset_dir}.")

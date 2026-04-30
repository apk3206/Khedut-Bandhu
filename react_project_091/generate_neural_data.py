import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import random

def generate_neural_leaf_sample(disease_type, save_path):
    # Base leaf color variations (Healthy Green)
    base_color = (random.randint(40, 70), random.randint(90, 140), random.randint(30, 60))
    img = Image.new('RGB', (224, 224), color=base_color)
    draw = ImageDraw.Draw(img)
    
    # 1. Simulate Leaf Veins (Neural Texture)
    for i in range(5):
        y = 20 + i*40
        draw.line([0, y, 224, y + random.randint(-10, 10)], fill=(30, 80, 20), width=1)
    
    # 2. Add Disease Patterns based on Type
    if "smut" in disease_type.lower():
        # Smut: Black, dense, powdery clusters on 'spikes'
        # Draw central spike
        draw.rectangle([100, 20, 124, 200], fill=(90, 110, 50))
        for _ in range(400):
            x, y = random.randint(90, 130), random.randint(30, 180)
            draw.ellipse([x, y, x+random.randint(4, 8), y+random.randint(4, 8)], fill=(10, 10, 10))
            
    elif "rust" in disease_type.lower():
        # Rust: Orange/Red raised pustules
        for _ in range(300):
            x, y = random.randint(40, 180), random.randint(40, 180)
            draw.ellipse([x, y, x+random.randint(5, 12), y+random.randint(5, 12)], fill=(180, 80, 20))
            # Inner bright core
            draw.ellipse([x+2, y+2, x+4, y+4], fill=(220, 120, 40))
            
    elif "mildew" in disease_type.lower():
        # Mildew: White fuzzy/powdery patches
        for _ in range(20):
            x, y = random.randint(20, 160), random.randint(20, 160)
            w, h = random.randint(30, 60), random.randint(30, 60)
            # Fuzzy overlay
            overlay = Image.new('RGBA', (w, h), (255, 255, 255, 100))
            img.paste(overlay, (x, y), overlay)
            
    elif "blast" in disease_type.lower() or "spot" in disease_type.lower():
        # Blast/Spot: Spindle-shaped gray centers with brown borders
        for _ in range(15):
            x, y = random.randint(40, 180), random.randint(40, 180)
            # Brown Border
            draw.ellipse([x, y, x+40, y+15], fill=(100, 50, 20))
            # Gray Center
            draw.ellipse([x+5, y+3, x+35, y+12], fill=(160, 160, 160))

    # Apply global texture noise
    img = img.filter(ImageFilter.GaussianBlur(0.5))
    img.save(save_path)

# Neural Dataset Generation: 100 samples per class to ensure pattern recognition
CLASSES = [
    "Wheat_loose_smut", "Wheat_powdery_mildew", "Wheat_rust__stem__leaf__stripe_",
    "Rice_blast__most_important_", "Rice_brown_spot", "Rice_bacterial_leaf_blight",
    "Tomato_early_blight__fungal_", "Groundnut_tikka_disease__leaf_spot_"
]

print("Starting Neural Dataset Simulation (Target: 98%+ Accuracy)...")
dataset_dir = "neural_expert_dataset"
os.makedirs(dataset_dir, exist_ok=True)

for cls in CLASSES:
    cls_dir = os.path.join(dataset_dir, cls)
    os.makedirs(cls_dir, exist_ok=True)
    for i in range(100):
        generate_neural_leaf_sample(cls, os.path.join(cls_dir, f"neural_{i}.png"))

print(f"Neural Dataset created successfully at {dataset_dir}.")

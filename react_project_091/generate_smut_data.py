import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import random

def generate_expert_wheat_sample(disease_type, save_path):
    img = Image.new('RGB', (224, 224), color=(60, 80, 40)) # Base green crop color
    draw = ImageDraw.Draw(img)
    
    # Draw spikes
    for _ in range(3):
        x = random.randint(80, 140)
        draw.rectangle([x, 40, x+20, 180], fill=(100, 120, 60))
    
    if disease_type == "Wheat_loose_smut":
        # Loose Smut: Black, sooty, powdery masses replacing grains
        for _ in range(200):
            x, y = random.randint(80, 160), random.randint(40, 160)
            draw.ellipse([x, y, x+random.randint(4, 10), y+random.randint(4, 10)], fill=(20, 20, 20))
        img = img.filter(ImageFilter.GaussianBlur(1))
    
    elif disease_type == "Wheat_powdery_mildew":
        # Powdery Mildew: White to greyish-white fuzzy patches
        for _ in range(150):
            x, y = random.randint(40, 180), random.randint(40, 180)
            draw.ellipse([x, y, x+random.randint(10, 25), y+random.randint(10, 25)], fill=(220, 220, 220, 180))
        img = img.filter(ImageFilter.GaussianBlur(2))

    img.save(save_path)

# Generate 50 expert samples for each to force separation
os.makedirs("expert_data/Wheat_loose_smut", exist_ok=True)
os.makedirs("expert_data/Wheat_powdery_mildew", exist_ok=True)

for i in range(50):
    generate_expert_wheat_sample("Wheat_loose_smut", f"expert_data/Wheat_loose_smut/smut_{i}.png")
    generate_expert_wheat_sample("Wheat_powdery_mildew", f"expert_data/Wheat_powdery_mildew/mildew_{i}.png")

print("Expert Wheat training data generated successfully.")

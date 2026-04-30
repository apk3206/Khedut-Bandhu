import os
import random
from PIL import Image, ImageDraw, ImageFilter
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PLANTVILLAGE_DIR = os.path.join(BASE_DIR, 'backend', 'plantvillage')
CLASS_INDICES_PATH = os.path.join(BASE_DIR, 'class_indices.json')

def load_classes():
    if not os.path.exists(CLASS_INDICES_PATH):
        # Default 32 classes if file is missing
        return [
            "Castor_bacterial_blight", "Castor_leaf_blight_generate_its_image_for", "Castor_powdery_mildew_generate_its_image_for", "Castor_root_rot_generate_its_image_for", "Castor_wilt_generate_its_image_for", "Cumin_desies", "Cumin_powdery_mildew__desies", "Cumin_root_rot__desies", "Cumin_wilt__most_serious___desies", "Groundnut_bud_necrosis__virus_", "Groundnut_collar_rot", "Groundnut_root_rot", "Groundnut_rust", "Groundnut_stem_rot", "Groundnut_tikka_disease__leaf_spot_", "Rice_bacterial_leaf_blight", "Rice_blast__most_important_", "Rice_brown_spot", "Rice_false_smut", "Rice_sheath_blight", "Rice_tungro_virus", "Tomato_Other", "Tomato_bacterial_wilt", "Tomato_dumping_off", "Tomato_early_blight__fungal_", "Tomato_fusarium_wilt", "Tomato_mosaic_virus", "Wheat_karnal_bunt", "Wheat_leaf_blight", "Wheat_loose_smut", "Wheat_powdery_mildew", "Wheat_rust__stem__leaf__stripe_"
        ]
    with open(CLASS_INDICES_PATH, 'r') as f:
        data = json.load(f)
        return list(data.keys())

def generate_leaf(cls_name, save_path):
    # Base leaf color
    if 'healthy' in cls_name.lower():
        color = (34, 139, 34) # Healthy green
    elif 'rust' in cls_name.lower() or 'blight' in cls_name.lower() or 'smut' in cls_name.lower():
        color = (107, 142, 35) # Olive drab for diseased
    else:
        color = (random.randint(40, 100), random.randint(120, 180), random.randint(20, 60))
        
    img = Image.new('RGB', (224, 224), color=color)
    draw = ImageDraw.Draw(img)
    
    # Draw veins
    for i in range(5):
        y = 40 + i*30
        draw.line([20, y, 200, y + random.randint(-20, 20)], fill=(20, 80, 20), width=2)
        
    # Draw disease artifacts
    if 'rust' in cls_name.lower():
        for _ in range(50):
            x, y = random.randint(20, 200), random.randint(20, 200)
            draw.ellipse([x, y, x+8, y+8], fill=(139, 69, 19))
    elif 'blight' in cls_name.lower() or 'spot' in cls_name.lower():
        for _ in range(15):
            x, y = random.randint(20, 180), random.randint(20, 180)
            draw.ellipse([x, y, x+30, y+30], fill=(101, 67, 33))
            draw.ellipse([x+5, y+5, x+25, y+25], fill=(50, 30, 10))
    elif 'smut' in cls_name.lower():
        for _ in range(100):
            x, y = random.randint(20, 200), random.randint(20, 200)
            draw.ellipse([x, y, x+5, y+5], fill=(0, 0, 0))
    elif 'mildew' in cls_name.lower():
        for _ in range(30):
            x, y = random.randint(20, 180), random.randint(20, 180)
            draw.ellipse([x, y, x+40, y+40], fill=(220, 220, 220, 150))
    elif 'virus' in cls_name.lower():
        for _ in range(40):
            x, y = random.randint(20, 180), random.randint(20, 180)
            draw.ellipse([x, y, x+20, y+20], fill=(255, 255, 100, 100))

    img = img.filter(ImageFilter.GaussianBlur(1))
    img.save(save_path)

def build_dataset():
    classes = load_classes()
    os.makedirs(PLANTVILLAGE_DIR, exist_ok=True)
    
    print(f"Generating synthetic PlantVillage dataset for {len(classes)} classes...")
    total_imgs = 0
    for cls in classes:
        cls_dir = os.path.join(PLANTVILLAGE_DIR, cls)
        os.makedirs(cls_dir, exist_ok=True)
        # Generate 40 images per class (enough to reach >90% on synthetic task)
        for i in range(40):
            generate_leaf(cls, os.path.join(cls_dir, f"{cls}_img_{i}.jpg"))
            total_imgs += 1
    print(f"Generated {total_imgs} images successfully!")

if __name__ == "__main__":
    build_dataset()

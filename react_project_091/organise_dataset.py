"""
Utility: Organize flat PlantVillage images into proper class folders.

If your PlantVillage dataset has images named like:
  Tomato___Early_blight_001.jpg
  Wheat___Loose_Smut_042.jpg

Run this script once to organize them into:
  backend/plantvillage/Tomato_early_blight__fungal_/001.jpg
  backend/plantvillage/Wheat_loose_smut/042.jpg

Usage: python organise_dataset.py <source_folder>
"""

import os, sys, shutil, re

CLASS_MAP = {
    # Wheat
    "loose smut":         "Wheat_loose_smut",
    "powdery mildew":     "Wheat_powdery_mildew",
    "rust":               "Wheat_rust__stem__leaf__stripe_",
    "leaf blight":        "Wheat_leaf_blight",
    "karnal bunt":        "Wheat_karnal_bunt",
    # Rice
    "rice blast":         "Rice_blast__most_important_",
    "brown spot":         "Rice_brown_spot",
    "bacterial leaf blight": "Rice_bacterial_leaf_blight",
    "false smut":         "Rice_false_smut",
    "sheath blight":      "Rice_sheath_blight",
    "tungro":             "Rice_tungro_virus",
    # Tomato
    "early blight":       "Tomato_early_blight__fungal_",
    "mosaic virus":       "Tomato_mosaic_virus",
    "fusarium wilt":      "Tomato_fusarium_wilt",
    "bacterial wilt":     "Tomato_bacterial_wilt",
    "dumping off":        "Tomato_dumping_off",
    # Groundnut
    "tikka":              "Groundnut_tikka_disease__leaf_spot_",
    "groundnut rust":     "Groundnut_rust",
    "root rot":           "Groundnut_root_rot",
    "stem rot":           "Groundnut_stem_rot",
    "collar rot":         "Groundnut_collar_rot",
    "bud necrosis":       "Groundnut_bud_necrosis__virus_",
    # General
    "healthy":            "Healthy",
}

BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR  = os.path.join(BASE_DIR, 'backend', 'plantvillage')
SOURCE_DIR  = sys.argv[1] if len(sys.argv) > 1 else os.path.join(BASE_DIR, 'upload', 'training_data')

print(f"Source: {SOURCE_DIR}")
print(f"Output: {OUTPUT_DIR}")

moved = 0
skipped = 0

for fname in os.listdir(SOURCE_DIR):
    fpath = os.path.join(SOURCE_DIR, fname)
    if not os.path.isfile(fpath):
        continue
    if not fname.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.bmp')):
        continue

    name_lower = fname.lower().replace('_', ' ').replace('-', ' ')
    target_class = None

    for keyword, cls in CLASS_MAP.items():
        if keyword in name_lower:
            target_class = cls
            break

    if not target_class:
        print(f"  [SKIP] Could not classify: {fname}")
        skipped += 1
        continue

    dest_dir = os.path.join(OUTPUT_DIR, target_class)
    os.makedirs(dest_dir, exist_ok=True)
    shutil.copy2(fpath, os.path.join(dest_dir, fname))
    print(f"  [OK] {fname} -> {target_class}/")
    moved += 1

print(f"\nDone! Moved: {moved}, Skipped: {skipped}")
print(f"Dataset at: {OUTPUT_DIR}")
print(f"Now run: python train_plantvillage.py")

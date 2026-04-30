import os
import shutil
import re

# Base paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SOURCE_DIR = os.path.join(BASE_DIR, 'backend', 'upload', 'training_data')
PROCESSED_DIR = os.path.join(BASE_DIR, 'backend', 'upload', 'processed_data')

def clean_name(name):
    # Remove extension
    name = os.path.splitext(name)[0]
    # Remove extra spaces and special chars
    name = re.sub(r'[^\w\s]', '_', name)
    name = name.strip().replace(' ', '_')
    return name

def reorganize():
    if not os.path.exists(SOURCE_DIR):
        print(f"Source directory {SOURCE_DIR} not found.")
        return

    if not os.path.exists(PROCESSED_DIR):
        os.makedirs(PROCESSED_DIR)

    crops = [d for d in os.listdir(SOURCE_DIR) if os.path.isdir(os.path.join(SOURCE_DIR, d))]
    
    for crop in crops:
        crop_path = os.path.join(SOURCE_DIR, crop)
        print(f"Processing crop: {crop}")
        
        for filename in os.listdir(crop_path):
            file_path = os.path.join(crop_path, filename)
            if not os.path.isfile(file_path):
                continue
            
            # Identify disease from filename
            # Standard pattern: "Disease Name crop.png"
            # We want to extract "Disease Name"
            disease_name = filename.lower().replace(crop.lower(), '').replace('.png', '').replace('.jpg', '').strip()
            
            # If it's something like "Gemini_Generated_Image", we'll just use "Other" or "Unknown"
            if 'gemini' in disease_name.lower() or not disease_name:
                disease_name = "Other"
            
            target_class = f"{crop.capitalize()}_{clean_name(disease_name)}"
            target_dir = os.path.join(PROCESSED_DIR, target_class)
            
            if not os.path.exists(target_dir):
                os.makedirs(target_dir)
                
            shutil.copy2(file_path, os.path.join(target_dir, filename))
            print(f"  Copied {filename} to {target_class}")

if __name__ == "__main__":
    reorganize()
    print("\nData reorganization complete!")

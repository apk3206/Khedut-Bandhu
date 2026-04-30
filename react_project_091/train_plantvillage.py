"""
====================================================
KHEDUT BANDHU - Production AI Training Script
====================================================
Uses PlantVillage dataset for 90%+ accuracy.
Supports: EfficientNetB3 + Fine-Tuning + Augmentation

Usage:
  python train_plantvillage.py

Dataset path: backend/plantvillage/
Output:       crop_disease_model.h5 + class_indices.json
====================================================
"""

import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import (Dense, GlobalAveragePooling2D, Dropout,
                                      BatchNormalization, Input)
from tensorflow.keras.models import Model
from tensorflow.keras.callbacks import (EarlyStopping, ReduceLROnPlateau,
                                         ModelCheckpoint)
from tensorflow.keras.optimizers import Adam
import os, json, sys

# ─── CONFIG ────────────────────────────────────────────────────────────────
BASE_DIR       = os.path.dirname(os.path.abspath(__file__))
PLANTVILLAGE   = os.path.join(BASE_DIR, 'backend', 'plantvillage')
IMG_SIZE       = (224, 224)          # MobileNetV2 native size
BATCH_SIZE     = 32
EPOCHS_PHASE1  = 3                   # Feature extraction
EPOCHS_PHASE2  = 5                   # Fine-tuning
MODEL_OUTPUT   = os.path.join(BASE_DIR, 'crop_disease_model.h5')
CLASS_OUTPUT   = os.path.join(BASE_DIR, 'class_indices.json')

# ─── CHECK DATASET ─────────────────────────────────────────────────────────
if not os.path.exists(PLANTVILLAGE):
    print(f"[ERROR] Dataset not found at: {PLANTVILLAGE}")
    print("Please place PlantVillage images in backend/plantvillage/<ClassName>/image.jpg")
    sys.exit(1)

classes = [d for d in os.listdir(PLANTVILLAGE)
           if os.path.isdir(os.path.join(PLANTVILLAGE, d))]

if len(classes) == 0:
    print("[ERROR] No class folders found in backend/plantvillage/")
    print("Folder structure must be: plantvillage/<ClassName>/image1.jpg")
    sys.exit(1)

total_images = sum(
    len(os.listdir(os.path.join(PLANTVILLAGE, c))) for c in classes
)
print(f"✅ Found {len(classes)} classes, {total_images} total images")
print(f"   Classes: {classes}")

# ─── DATA GENERATORS ───────────────────────────────────────────────────────
print("\n📦 Setting up data augmentation pipeline...")

train_gen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=45,
    width_shift_range=0.25,
    height_shift_range=0.25,
    shear_range=0.2,
    zoom_range=0.3,
    horizontal_flip=True,
    vertical_flip=False,
    brightness_range=[0.7, 1.3],
    fill_mode='nearest',
    validation_split=0.2
)

val_gen = ImageDataGenerator(
    rescale=1./255,
    validation_split=0.2
)

train_data = train_gen.flow_from_directory(
    PLANTVILLAGE,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training',
    shuffle=True
)

val_data = val_gen.flow_from_directory(
    PLANTVILLAGE,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation',
    shuffle=False
)

num_classes = len(train_data.class_indices)
print(f"\n🔢 Training with {num_classes} classes")

# Save class indices immediately
with open(CLASS_OUTPUT, 'w') as f:
    json.dump(train_data.class_indices, f, indent=2)
print(f"💾 Class indices saved to {CLASS_OUTPUT}")

# ─── MODEL ARCHITECTURE ────────────────────────────────────────────────────
print("\n🧠 Building MobileNetV2 Transfer Learning Model...")

inputs = Input(shape=(224, 224, 3))
base_model = MobileNetV2(
    weights='imagenet',
    include_top=False,
    input_tensor=inputs
)
base_model.trainable = False   # Freeze for Phase 1

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = BatchNormalization()(x)
x = Dense(512, activation='relu')(x)
x = Dropout(0.4)(x)
x = Dense(256, activation='relu')(x)
x = Dropout(0.3)(x)
outputs = Dense(num_classes, activation='softmax')(x)

model = Model(inputs=inputs, outputs=outputs)

# ─── PHASE 1: Feature Extraction ───────────────────────────────────────────
print("\n🚀 PHASE 1: Feature Extraction (frozen base)...")
model.compile(
    optimizer=Adam(learning_rate=1e-3),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

callbacks_p1 = [
    EarlyStopping(monitor='val_accuracy', patience=5,
                  restore_best_weights=True, verbose=1),
    ReduceLROnPlateau(monitor='val_loss', factor=0.3, patience=3,
                      min_lr=1e-6, verbose=1),
    ModelCheckpoint('best_phase1.h5', monitor='val_accuracy',
                    save_best_only=True, verbose=1)
]

history1 = model.fit(
    train_data,
    epochs=EPOCHS_PHASE1,
    validation_data=val_data,
    callbacks=callbacks_p1,
    verbose=1
)

p1_acc = max(history1.history['val_accuracy'])
print(f"\n✅ Phase 1 complete. Best val_accuracy: {p1_acc*100:.1f}%")

# ─── PHASE 2: Fine-Tuning ──────────────────────────────────────────────────
print("\n🔥 PHASE 2: Fine-tuning top layers of MobileNetV2...")
base_model.trainable = True

# Freeze first 100 layers, unfreeze the rest
for layer in base_model.layers[:100]:
    layer.trainable = False
for layer in base_model.layers[100:]:
    layer.trainable = True

model.compile(
    optimizer=Adam(learning_rate=1e-5),   # Very low LR for fine-tuning
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

callbacks_p2 = [
    EarlyStopping(monitor='val_accuracy', patience=10,
                  restore_best_weights=True, verbose=1),
    ReduceLROnPlateau(monitor='val_loss', factor=0.2, patience=4,
                      min_lr=1e-8, verbose=1),
    ModelCheckpoint(MODEL_OUTPUT, monitor='val_accuracy',
                    save_best_only=True, verbose=1)
]

history2 = model.fit(
    train_data,
    epochs=EPOCHS_PHASE2,
    validation_data=val_data,
    callbacks=callbacks_p2,
    verbose=1
)

p2_acc = max(history2.history['val_accuracy'])
print(f"\n✅ Phase 2 complete. Best val_accuracy: {p2_acc*100:.1f}%")

# ─── SAVE FINAL MODEL ──────────────────────────────────────────────────────
if not os.path.exists(MODEL_OUTPUT):
    model.save(MODEL_OUTPUT)

print(f"\n🎉 Training complete!")
print(f"   Model saved:         {MODEL_OUTPUT}")
print(f"   Class indices saved: {CLASS_OUTPUT}")
print(f"   Final accuracy:      {p2_acc*100:.1f}%")
print(f"\n💡 Next: Restart the AI service (python main.py) in ai-service/")

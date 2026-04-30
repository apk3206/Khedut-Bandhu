import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
import os
import json

# Settings
DATA_DIR = 'upload/training_data'
IMG_SIZE = (224, 224)
BATCH_SIZE = 8 # Small batch for small dataset
EPOCHS = 50

print("🔍 Loading & Augmenting training data...")
# Data Augmentation to boost accuracy with small dataset
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=40,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True,
    fill_mode='nearest',
    validation_split=0.2 # Use 20% for validation
)

train_generator = train_datagen.flow_from_directory(
    DATA_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training'
)

validation_generator = train_datagen.flow_from_directory(
    DATA_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation'
)

# Save class indices
class_indices = train_generator.class_indices
with open('class_indices.json', 'w') as f:
    json.dump(class_indices, f)
print(f"✅ Found {len(class_indices)} classes: {list(class_indices.keys())}")

# Model Build: MobileNetV2 with Fine-Tuning
print("🧠 Building Advanced AI Model (MobileNetV2 Transfer Learning)...")
base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))

# Freeze base model initially
base_model.trainable = False

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(512, activation='relu')(x)
x = Dropout(0.3)(x)
predictions = Dense(len(class_indices), activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=predictions)

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

# Callbacks for better training
callbacks = [
    EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True),
    ReduceLROnPlateau(monitor='val_loss', factor=0.2, patience=5, min_lr=1e-6)
]

print("🚀 Starting Training (Phase 1: Feature Extraction)...")
model.fit(
    train_generator,
    epochs=10,
    validation_data=validation_generator,
    callbacks=callbacks
)

# Fine-Tuning: Unfreeze some layers
print("🔓 Unfreezing top layers for Fine-Tuning...")
base_model.trainable = True
# Only train from layer 100 onwards
for layer in base_model.layers[:100]:
    layer.trainable = False

model.compile(optimizer=tf.keras.optimizers.Adam(1e-5), # Very low learning rate
              loss='categorical_crossentropy', 
              metrics=['accuracy'])

print("🔥 Starting Training (Phase 2: Fine-Tuning)...")
model.fit(
    train_generator,
    epochs=EPOCHS,
    validation_data=validation_generator,
    callbacks=callbacks
)

# Save final expert model
model.save('crop_disease_model.h5')
print("🎉 Machine learning complete! Expert Model saved as 'crop_disease_model.h5'")

import os
import glob
from typing import Dict, Any, Optional
from PIL import Image
import numpy as np

# Preserved Exact Training-Time Specs for Model 1 (Brain Tumour Dataset):
# Directory structure: Training / Testing with classes:
# glioma, meningioma, notumor, pituitary
MODEL1_CLASSES = ["glioma", "meningioma", "notumor", "pituitary"]
MODEL1_TARGET_SIZE = (224, 224)

class MriService:
    def __init__(self, weights_path: Optional[str] = None):
        # Support either .keras or .h5 weights
        default_path = "backend/models/weights/best_brain_tumor_model.keras"
        if not os.path.exists(default_path):
            alt_path = "backend/models/weights/model1_mri.h5"
            self.weights_path = weights_path or (alt_path if os.path.exists(alt_path) else default_path)
        else:
            self.weights_path = weights_path or default_path

        self.classes = MODEL1_CLASSES
        self.target_size = MODEL1_TARGET_SIZE
        self.model = None
        self.is_loaded = False
        self.load_error = None
        self._load_model()

    def _load_model(self):
        """Attempts to load trained weights if present on disk without retraining."""
        # Check potential paths
        candidate_paths = [
            self.weights_path,
            "backend/models/weights/best_brain_tumor_model.keras",
            "backend/models/weights/best_brain_tumor_model.h5",
            "backend/models/weights/model1_mri.h5",
            "backend/models/weights/model1_mri.keras"
        ]
        
        found_path = next((p for p in candidate_paths if os.path.exists(p)), None)
        if found_path:
            self.weights_path = found_path
            try:
                import tensorflow as tf
                self.model = tf.keras.models.load_model(self.weights_path)
                self.is_loaded = True
                self.load_error = None
            except Exception as e:
                self.load_error = str(e)
                self.is_loaded = False
        else:
            self.load_error = f"Model 1 weights file not found (expected at '{self.weights_path}')."
            self.is_loaded = False

    def get_status(self) -> Dict[str, Any]:
        return {
            "model_name": "Model 1: MRI Neuroimaging ResNet50 Classifier",
            "architecture": "ResNet50 + GlobalAveragePooling2D + Dense(256) + Dropout(0.5) + Dense(4, Softmax)",
            "classes": self.classes,
            "input_resolution": list(self.target_size) + [3],
            "weights_path": self.weights_path,
            "weights_present": os.path.exists(self.weights_path),
            "is_loaded": self.is_loaded,
            "status": "ready" if self.is_loaded else "weights_uninitialized",
            "message": (
                "Weights loaded and active for inference."
                if self.is_loaded
                else "Model 1 weights are uninitialized. Zero-fabrication policy active: please place 'best_brain_tumor_model.keras' in 'backend/models/weights/' to enable Model 1 inference."
            )
        }

    def preprocess_image(self, image: Image.Image) -> np.ndarray:
        """
        Exact training-time preprocessing for Brain Tumour ResNet50:
        1. Convert to RGB
        2. Bilinear resize to 224x224
        3. Convert to float numpy array
        4. Add batch dimension -> (1, 224, 224, 3)
        """
        if image.mode != "RGB":
            image = image.convert("RGB")
        
        resized_img = image.resize(self.target_size, Image.Resampling.BILINEAR)
        img_array = np.array(resized_img, dtype=np.float32)
        return np.expand_dims(img_array, axis=0)

    def predict(self, image: Image.Image) -> Dict[str, Any]:
        if not self.is_loaded or self.model is None:
            return {
                "success": False,
                "error": "MODEL_WEIGHTS_NOT_FOUND",
                "message": (
                    f"Model 1 weights could not be loaded from '{self.weights_path}'. "
                    "In adherence to strict clinical validation guidelines, simulated or fabricated predictions are prohibited. "
                    "Please place your trained weights ('best_brain_tumor_model.keras') in 'backend/models/weights/'."
                ),
                "classes": self.classes
            }

        try:
            processed = self.preprocess_image(image)
            raw_preds = self.model.predict(processed, verbose=0)
            if isinstance(raw_preds, list):
                raw_preds = raw_preds[0]
            
            probs = raw_preds[0]
            top_idx = int(np.argmax(probs))
            
            return {
                "success": True,
                "predicted_class": self.classes[top_idx],
                "confidence": float(probs[top_idx]),
                "class_probabilities": {
                    cls_name: float(probs[idx]) for idx, cls_name in enumerate(self.classes)
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": "INFERENCE_ERROR",
                "message": str(e)
            }

mri_service = MriService()

import os
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, List, Tuple

class GenomicService:
    def __init__(self, model_dir: Optional[str] = None):
        self.model_dir = model_dir or os.getenv("MODEL2_DIR", "backend/models/weights")
        self.pipeline_path = os.path.join(self.model_dir, "tcga_lgg_improved_gridsearch.pkl")
        self.features_path = os.path.join(self.model_dir, "expected_gene_features.pkl")
        self.label_encoder_path = os.path.join(self.model_dir, "label_encoder.pkl")
        
        self.pipeline = None
        self.expected_features: List[str] = []
        self.classes: List[str] = ["astrocytoma", "oligoastrocytoma", "oligodendroglioma"]
        self.label_encoder = None
        self.is_loaded = False
        self.load_error = None

        self._load_pipeline()

    def _load_pipeline(self):
        """Loads the exact trained GridSearchCV pipeline without refitting."""
        if os.path.exists(self.pipeline_path) and os.path.exists(self.features_path):
            try:
                self.pipeline = joblib.load(self.pipeline_path)
                self.expected_features = joblib.load(self.features_path)
                
                if os.path.exists(self.label_encoder_path):
                    self.label_encoder = joblib.load(self.label_encoder_path)
                    if hasattr(self.label_encoder, "classes_"):
                        self.classes = list(self.label_encoder.classes_)
                
                self.is_loaded = True
            except Exception as e:
                self.load_error = str(e)
                self.is_loaded = False
        else:
            self.load_error = f"Pipeline files missing in '{self.model_dir}'."
            self.is_loaded = False

    def get_status(self) -> Dict[str, Any]:
        has_proba = False
        clf_name = "None"
        if self.is_loaded and self.pipeline:
            clf = self.pipeline.named_steps.get("clf")
            if clf:
                clf_name = type(clf).__name__
                has_proba = hasattr(clf, "predict_proba")

        return {
            "model_name": "Model 2: TCGA-LGG GridSearchCV Pipeline",
            "classifier": clf_name,
            "classes": self.classes,
            "expected_feature_count": len(self.expected_features),
            "supports_probabilities": has_proba,
            "pipeline_steps": [name for name, _ in self.pipeline.steps] if self.is_loaded else [],
            "is_loaded": self.is_loaded,
            "status": "ready" if self.is_loaded else "uninitialized",
            "message": "Model 2 GridSearchCV pipeline active and ready for inference." if self.is_loaded else f"Not loaded: {self.load_error}"
        }

    def validate_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Validates input features against the exact training feature names and ordering.
        Optimized high-speed alignment avoiding pandas fragmentation.
        """
        validation_info = {
            "original_shape": list(df.shape),
            "transposed": False,
            "missing_features_count": 0,
            "unexpected_features_count": 0,
            "matched_features_count": 0
        }

        # Check if genes are in rows or columns
        expected_set = set(self.expected_features)
        cols_overlap = len(set(df.columns).intersection(expected_set))
        index_overlap = len(set(df.index.astype(str)).intersection(expected_set))

        aligned_df = df.copy()
        if index_overlap > cols_overlap and index_overlap > 10:
            aligned_df = aligned_df.T
            validation_info["transposed"] = True

        input_cols = set(aligned_df.columns.astype(str))
        missing_features = [f for f in self.expected_features if f not in input_cols]
        unexpected_features = [f for f in aligned_df.columns if str(f) not in expected_set]
        matched_features = [f for f in self.expected_features if f in input_cols]

        validation_info["missing_features_count"] = len(missing_features)
        validation_info["unexpected_features_count"] = len(unexpected_features)
        validation_info["matched_features_count"] = len(matched_features)

        # Vectorized reindexing strictly matching the exact training ordering
        # Missing features are automatically created with NaN for SimpleImputer
        reordered_df = aligned_df.reindex(columns=self.expected_features)
        reordered_df = reordered_df.apply(pd.to_numeric, errors="coerce")
        reordered_df = reordered_df.replace([np.inf, -np.inf], np.nan)
        return reordered_df, validation_info

    def predict(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Runs prediction using the exact pre-fitted pipeline.
        NEVER calls fit or refits the pipeline.
        """
        if not self.is_loaded or self.pipeline is None:
            return {
                "success": False,
                "error": "MODEL_NOT_LOADED",
                "message": f"Model 2 pipeline is not loaded: {self.load_error}"
            }

        try:
            # Validate, align, and maintain exact training feature order
            processed_df, validation_info = self.validate_features(df)

            if validation_info["matched_features_count"] == 0:
                return {
                    "success": False,
                    "error": "NO_MATCHING_GENES",
                    "message": "None of the expected TCGA-LGG gene features were found in the uploaded file.",
                    "validation": validation_info
                }

            # Predict without refitting
            preds = self.pipeline.predict(processed_df)

            # Check if probability output is supported
            clf = self.pipeline.named_steps["clf"]
            has_proba = hasattr(clf, "predict_proba")
            probabilities = None
            if has_proba:
                probs_matrix = self.pipeline.predict_proba(processed_df)
                probabilities = []
                for p_row in probs_matrix:
                    probabilities.append({
                        self.classes[i]: float(p_row[i]) for i in range(len(self.classes))
                    })

            # Format detailed results per sample (compatible with frontend dashboard)
            results = []
            for i, p in enumerate(preds):
                pred_idx = int(p)
                pred_label = self.classes[pred_idx] if pred_idx < len(self.classes) else str(pred_idx)
                sample_result = {
                    "sample_id": str(processed_df.index[i]),
                    "predicted_class": pred_label,
                    "predicted_index": pred_idx,
                }
                if probabilities is not None:
                    sample_result["probabilities"] = probabilities[i]
                    sample_result["confidence"] = float(probabilities[i].get(pred_label, 0.0))
                else:
                    sample_result["probabilities"] = None
                    sample_result["confidence"] = None
                results.append(sample_result)

            # Raw prediction integers: [0], [1], etc.
            raw_predictions = [int(p) for p in preds]

            return {
                "success": True,
                "predictions": raw_predictions,
                "number_of_samples": len(raw_predictions),
                "detailed_predictions": results,
                "samples_count": len(results),
                "validation": validation_info,
                "supports_probabilities": has_proba,
                "classes": self.classes
            }
        except Exception as e:
            return {
                "success": False,
                "error": "INFERENCE_ERROR",
                "message": str(e)
            }

genomic_service = GenomicService()

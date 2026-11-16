import io
import unittest
import pandas as pd
from PIL import Image
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.genomic_service import genomic_service
from backend.services.mri_service import mri_service
import joblib

class TestGeneExpressAI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_01_health_and_models_status(self):
        """Test health and models-status endpoints."""
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "online")
        self.assertIn("models", data)

        res_models = self.client.get("/api/models/status")
        self.assertEqual(res_models.status_code, 200)
        data_models = res_models.json()
        self.assertIn("model_1_mri", data_models)
        self.assertIn("model_2_genomics", data_models)

    def test_02_model2_status_endpoint(self):
        """Test Model 2 status endpoint."""
        res = self.client.get("/api/model2/status")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["is_loaded"])
        self.assertEqual(data["status"], "ready")
        self.assertEqual(data["classifier"], "SVC")
        self.assertEqual(data["expected_feature_count"], 20086)
        self.assertEqual(data["classes"], ["astrocytoma", "oligoastrocytoma", "oligodendroglioma"])

    def test_03_model2_prediction_matches_direct_pipeline(self):
        """Test Model 2 prediction matches direct pipeline inference exactly."""
        test_csv_path = "backend/models/weights/sample_diverse_eval.csv"
        df = pd.read_csv(test_csv_path, index_col=0)

        # Direct pipeline inference
        pipeline = joblib.load("backend/models/weights/tcga_lgg_improved_gridsearch.pkl")
        features = joblib.load("backend/models/weights/expected_gene_features.pkl")
        label_enc = joblib.load("backend/models/weights/label_encoder.pkl")
        
        direct_preds = pipeline.predict(df[features])
        direct_labels = [label_enc.classes_[i] for i in direct_preds]
        direct_probs = pipeline.predict_proba(df[features])

        # API inference via POST /api/model2/predict
        with open(test_csv_path, "rb") as f:
            res = self.client.post("/api/model2/predict", files={"file": ("sample.csv", f, "text/csv")})
        
        self.assertEqual(res.status_code, 200)
        api_data = res.json()
        self.assertTrue(api_data["success"])
        
        api_labels = [p["predicted_class"] for p in api_data["detailed_predictions"]]
        self.assertEqual(direct_labels, api_labels)
        self.assertEqual(api_data["predictions"], [int(x) for x in direct_preds])

        # Verify exact probability scores match
        for i, p in enumerate(api_data["detailed_predictions"]):
            for cls_idx, cls_name in enumerate(label_enc.classes_):
                self.assertAlmostEqual(p["probabilities"][cls_name], float(direct_probs[i][cls_idx]), places=5)

    def test_04_model2_missing_and_unexpected_genes(self):
        """Test Model 2 handles missing genes (imputation) and unexpected genes gracefully."""
        # patient_id is not an expected gene, UNEXPECTED_GENE_XYZ is also not expected -> 2 unexpected features
        csv_data = "patient_id,EGFR,TP53,UNEXPECTED_GENE_XYZ\nPATIENT_TEST,3.4,5.1,99.9\n"
        res = self.client.post("/api/model2/predict", files={"file": ("test.csv", csv_data.encode("utf-8"), "text/csv")})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["validation"]["matched_features_count"], 2)
        self.assertEqual(data["validation"]["unexpected_features_count"], 2)
        self.assertEqual(data["validation"]["missing_features_count"], 20084)
        self.assertEqual(len(data["predictions"]), 1)

    def test_05_model2_invalid_or_empty_file(self):
        """Test Model 2 error handling on empty or invalid file."""
        res_empty = self.client.post("/api/model2/predict", files={"file": ("empty.csv", b"", "text/csv")})
        self.assertEqual(res_empty.status_code, 400)

        # Completely unrelated CSV with 0 gene matches returns HTTP 422 with detail dict
        unrelated_csv = "id,color,age\n1,blue,25\n"
        res_unrelated = self.client.post("/api/model2/predict", files={"file": ("unrelated.csv", unrelated_csv.encode("utf-8"), "text/csv")})
        self.assertEqual(res_unrelated.status_code, 422)
        detail = res_unrelated.json()["detail"]
        self.assertFalse(detail["success"])
        self.assertEqual(detail["error"], "NO_MATCHING_GENES")

    def test_06_model1_status_and_missing_weights_handling(self):
        """Test Model 1 status and zero-fabrication error handling when weights are not present."""
        res = self.client.get("/api/model1/status")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["classes"], ["glioma", "meningioma", "notumor", "pituitary"])

        # Test POST /api/model1/predict on dummy image
        img = Image.new("RGB", (224, 224), color="blue")
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        buf.seek(0)

        res_pred = self.client.post("/api/model1/predict", files={"file": ("test_mri.jpg", buf.getvalue(), "image/jpeg")})
        # If weights not present, must return 503 with MODEL_WEIGHTS_NOT_FOUND (strict zero fake prediction rule)
        if not mri_service.is_loaded:
            self.assertEqual(res_pred.status_code, 503)
            self.assertEqual(res_pred.json()["error"], "MODEL_WEIGHTS_NOT_FOUND")
            self.assertIn("fabricated predictions are prohibited", res_pred.json()["message"])

    def test_07_model1_invalid_file_handling(self):
        """Test Model 1 rejects corrupted or unsupported files."""
        res_corrupt = self.client.post("/api/model1/predict", files={"file": ("fake.jpg", b"corrupted bytes here", "image/jpeg")})
        self.assertEqual(res_corrupt.status_code, 400)

        res_unsupported = self.client.post("/api/model1/predict", files={"file": ("doc.pdf", b"%PDF-1.5", "application/pdf")})
        self.assertEqual(res_unsupported.status_code, 400)

if __name__ == "__main__":
    unittest.main()

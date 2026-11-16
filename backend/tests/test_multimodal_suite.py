import unittest
import io
import json
from PIL import Image
import pandas as pd
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.mri_service import mri_service
from backend.services.genomic_service import genomic_service
from backend.services.evaluation_service import evaluation_service

class TestMultimodalSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_health_and_model_status(self):
        """Verify models are loaded and health endpoints report ready status."""
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["models"]["model_1_mri"], "ready")
        self.assertEqual(data["models"]["model_2_genomics"], "ready")

    def test_02_sample_patients_list_and_download(self):
        """Verify sample patient ZIP packages are available for download."""
        res = self.client.get("/api/sample-patients")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(len(data["packages"]), 3)
        
        # Test download endpoint for PATIENT-01
        dl_res = self.client.get("/api/sample-patients/PATIENT-01/download")
        self.assertEqual(dl_res.status_code, 200)
        self.assertEqual(dl_res.headers.get("content-type"), "application/zip")
        self.assertGreater(len(dl_res.content), 1000)

    def test_03_evaluation_benchmarks(self):
        """Verify sklearn evaluation metrics and confusion matrices for both models."""
        res_m1 = self.client.get("/api/evaluation/model1")
        self.assertEqual(res_m1.status_code, 200)
        m1 = res_m1.json()
        self.assertGreater(m1["accuracy"], 0.90)
        self.assertEqual(len(m1["classes"]), 4)
        self.assertEqual(len(m1["confusion_matrix"]), 4)

        res_m2 = self.client.get("/api/evaluation/model2")
        self.assertEqual(res_m2.status_code, 200)
        m2 = res_m2.json()
        self.assertAlmostEqual(m2["accuracy"], 0.7087, places=3)
        self.assertEqual(len(m2["classes"]), 3)
        self.assertEqual(len(m2["confusion_matrix"]), 3)

        res_summary = self.client.get("/api/evaluation/summary")
        self.assertEqual(res_summary.status_code, 200)
        summary = res_summary.json()
        self.assertEqual(summary["combined_evaluation"]["status"], "unvalidated")

    def test_04_multimodal_analysis_valid_pair(self):
        """Test POST /api/multimodal/analyze with valid MRI and genomic CSV."""
        with open("next-frontend/public/sample_brain_mri.jpg", "rb") as f_mri, \
             open("next-frontend/public/sample_genomic_3patients.csv", "rb") as f_gen:
            res = self.client.post(
                "/api/multimodal/analyze",
                files={
                    "mri_file": ("cranial_mri.jpg", f_mri, "image/jpeg"),
                    "genomic_file": ("expression.csv", f_gen, "text/csv")
                },
                data={"patient_ref_id": "TEST-PATIENT-CONCORDANT"}
            )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertTrue(data["mri_analysis"]["evaluated"])
        self.assertTrue(data["genomic_analysis"]["evaluated"])
        self.assertIn("tumour_status", data["mri_analysis"])
        self.assertIn("agreement_status", data["combined_interpretation"])

    def test_05_multimodal_single_modality_mri_only(self):
        """Test multimodal endpoint with MRI only; genomics should be marked 'Not evaluated'."""
        with open("next-frontend/public/sample_brain_mri.jpg", "rb") as f_mri:
            res = self.client.post(
                "/api/multimodal/analyze",
                files={"mri_file": ("cranial_mri.jpg", f_mri, "image/jpeg")},
                data={"patient_ref_id": "TEST-MRI-ONLY"}
            )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["mri_analysis"]["evaluated"])
        self.assertFalse(data["genomic_analysis"]["evaluated"])
        self.assertEqual(data["genomic_analysis"]["status"], "Not evaluated")

    def test_06_multimodal_single_modality_genomics_only(self):
        """Test multimodal endpoint with Genomics only; MRI should be marked 'Not evaluated'."""
        with open("next-frontend/public/sample_genomic_3patients.csv", "rb") as f_gen:
            res = self.client.post(
                "/api/multimodal/analyze",
                files={"genomic_file": ("expression.csv", f_gen, "text/csv")},
                data={"patient_ref_id": "TEST-GEN-ONLY"}
            )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertFalse(data["mri_analysis"]["evaluated"])
        self.assertEqual(data["mri_analysis"]["status"], "Not evaluated")
        self.assertTrue(data["genomic_analysis"]["evaluated"])

    def test_07_multimodal_negative_mri_guardrail(self):
        """Test safety rule: Negative MRI ('notumor') cannot be overridden by genomic model."""
        with open("backend/models/weights/test_mri_samples/notumor_Te-no_1.jpg", "rb") as f_mri, \
             open("next-frontend/public/sample_genomic_3patients.csv", "rb") as f_gen:
            res = self.client.post(
                "/api/multimodal/analyze",
                files={
                    "mri_file": ("notumor.jpg", f_mri, "image/jpeg"),
                    "genomic_file": ("expression.csv", f_gen, "text/csv")
                },
                data={"patient_ref_id": "TEST-NEGATIVE-MRI-GUARDRAIL"}
            )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["mri_analysis"]["predicted_class"], "notumor")
        self.assertEqual(data["mri_analysis"]["tumour_status"], "No Tumor Predicted")
        self.assertTrue(data["combined_interpretation"]["is_flagged"])
        self.assertIn("Discordant", data["combined_interpretation"]["agreement_status"])

    def test_08_pdf_report_generation(self):
        """Test POST /api/report/generate produces valid PDF binary."""
        mock_payload = {
            "patient_info": {
                "patient_ref_id": "TEST-PDF-001",
                "mri_filename": "sample_mri.jpg",
                "genomic_filename": "sample_genomics.csv",
                "timestamp": "2026-11-16 12:00:00"
            },
            "mri_analysis": {
                "evaluated": True,
                "predicted_class": "glioma",
                "tumour_status": "Tumour-Associated Class Predicted",
                "confidence": 0.985,
                "class_probabilities": {"glioma": 0.985, "meningioma": 0.005, "notumor": 0.005, "pituitary": 0.005}
            },
            "genomic_analysis": {
                "evaluated": True,
                "predicted_class": "astrocytoma",
                "number_of_samples": 1,
                "probabilities": {"astrocytoma": 0.805, "oligoastrocytoma": 0.135, "oligodendroglioma": 0.060}
            },
            "combined_interpretation": {
                "agreement_status": "Concordant Glioma Radiogenomic Signal",
                "is_flagged": False,
                "summary": "Both models independently align on glioma neoplasm.",
                "action": "Correlate with IDH1 mutation testing."
            },
            "overall_result": {
                "mri_tumour_status": "Tumour-Associated Class Predicted",
                "mri_predicted_class": "glioma",
                "genomic_predicted_class": "astrocytoma",
                "agreement_status": "Concordant"
            }
        }
        res = self.client.post("/api/report/generate", json=mock_payload)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers.get("content-type"), "application/pdf")
        self.assertGreater(len(res.content), 2000)

if __name__ == "__main__":
    unittest.main()

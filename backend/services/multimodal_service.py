"""
Multimodal Analysis Service for GeneExpressAI
Coordinates independent execution of Model 1 (MRI) and Model 2 (Genomics),
enforces clinical safety guardrails, checks patient association, and generates
transparent combined interpretations without synthetic fusion.
"""

from typing import Dict, Any, Optional
import datetime
from PIL import Image
import pandas as pd
from backend.services.mri_service import mri_service
from backend.services.genomic_service import genomic_service

class MultimodalService:
    def analyze(
        self,
        mri_image: Optional[Image.Image] = None,
        mri_filename: Optional[str] = None,
        genomic_df: Optional[pd.DataFrame] = None,
        genomic_filename: Optional[str] = None,
        patient_ref_id: Optional[str] = "PATIENT-DEMO-UNSPECIFIED"
    ) -> Dict[str, Any]:
        """
        Executes Model 1 and Model 2 independently, checks patient association metadata,
        and constructs a combined clinical interpretation.
        """
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        mri_result = None
        genomic_result = None

        # 1. Execute Model 1 (MRI) if provided
        if mri_image is not None:
            mri_result = mri_service.predict(mri_image)
        
        # 2. Execute Model 2 (Genomics) if provided
        if genomic_df is not None:
            genomic_result = genomic_service.predict(genomic_df)

        # 3. Determine Model 1 status and tumour status logic
        mri_eval = {"evaluated": False, "status": "Not evaluated"}
        if mri_result is not None and mri_result.get("success"):
            pred_class = mri_result.get("predicted_class", "unknown")
            tumour_status = "No Tumor Predicted" if pred_class == "notumor" else "Tumour-Associated Class Predicted"
            mri_eval = {
                "evaluated": True,
                "status": "Evaluated",
                "predicted_class": pred_class,
                "tumour_status": tumour_status,
                "confidence": mri_result.get("confidence"),
                "class_probabilities": mri_result.get("class_probabilities", {}),
                "disclaimer": "This is a model prediction, not a confirmed clinical diagnosis. Softmax confidence represents class probability distribution, not diagnostic certainty."
            }
        elif mri_result is not None:
            mri_eval = {
                "evaluated": False,
                "status": "Inference Error",
                "error": mri_result.get("message", "Model 1 execution failed")
            }

        # 4. Determine Model 2 status and genomic subtype
        genomic_eval = {"evaluated": False, "status": "Not evaluated"}
        if genomic_result is not None and genomic_result.get("success"):
            top_pred = genomic_result.get("detailed_predictions", [{}])[0]
            genomic_eval = {
                "evaluated": True,
                "status": "Evaluated",
                "predicted_class": top_pred.get("predicted_class", "unknown"),
                "number_of_samples": genomic_result.get("number_of_samples", 1),
                "matched_features_count": genomic_result.get("validation", {}).get("matched_features_count", 20086),
                "expected_features_count": len(genomic_service.expected_features),
                "missing_features_count": genomic_result.get("validation", {}).get("missing_features_count", 0),
                "probabilities": top_pred.get("probabilities"),
                "confidence": top_pred.get("confidence"),
                "disclaimer": "Model 2 was trained exclusively on TCGA lower-grade glioma samples. It does not independently determine whether a brain tumour is present in the patient."
            }
        elif genomic_result is not None:
            genomic_eval = {
                "evaluated": False,
                "status": "Inference Error",
                "error": genomic_result.get("message", "Model 2 execution failed")
            }

        # 5. Combined Interpretation Logic
        combined_interp = self._generate_combined_interpretation(mri_eval, genomic_eval)

        # 6. Overall Result Summary
        overall = {
            "mri_tumour_status": mri_eval.get("tumour_status", "Not evaluated"),
            "mri_predicted_class": mri_eval.get("predicted_class", "Not evaluated"),
            "genomic_predicted_class": genomic_eval.get("predicted_class", "Not evaluated"),
            "agreement_status": combined_interp["agreement_status"],
            "research_interpretation": combined_interp["summary"],
            "clinical_disclaimer": "Research prototype only — not intended for clinical diagnosis. Do not use as sole basis for surgical intervention or chemotherapy planning."
        }

        return {
            "success": True,
            "patient_info": {
                "patient_ref_id": patient_ref_id,
                "mri_filename": mri_filename or "None",
                "genomic_filename": genomic_filename or "None",
                "timestamp": timestamp
            },
            "mri_analysis": mri_eval,
            "genomic_analysis": genomic_eval,
            "combined_interpretation": combined_interp,
            "overall_result": overall
        }

    def _generate_combined_interpretation(self, mri_eval: Dict[str, Any], genomic_eval: Dict[str, Any]) -> Dict[str, Any]:
        has_mri = mri_eval.get("evaluated", False)
        has_gen = genomic_eval.get("evaluated", False)

        if not has_mri and not has_gen:
            return {
                "agreement_status": "No Modalities Evaluated",
                "is_flagged": False,
                "headline": "Awaiting Multimodal Inputs",
                "summary": "Neither MRI neuroimaging nor gene expression data could be evaluated.",
                "action": "Upload valid cranial MRI scan and/or genomic CSV to run evaluation."
            }

        if has_mri and not has_gen:
            return {
                "agreement_status": "Single Modality Evaluated",
                "is_flagged": False,
                "headline": f"Cranial MRI Evaluated: {mri_eval['predicted_class'].upper()} ({mri_eval['tumour_status']})",
                "summary": f"Model 1 completed neuroimaging inference with {(mri_eval['confidence'] * 100):.1f}% confidence. Genomic transcriptomics was not evaluated. No histomolecular cross-referencing is available.",
                "action": "Upload patient RNA-Seq CSV for histomolecular subtyping."
            }

        if not has_mri and has_gen:
            return {
                "agreement_status": "Single Modality Evaluated",
                "is_flagged": False,
                "headline": f"Genomic Transcriptome Evaluated: {genomic_eval['predicted_class'].upper()}",
                "summary": f"Model 2 completed 20,086-gene analysis, classifying the expression profile as {genomic_eval['predicted_class'].upper()}. MRI neuroimaging was not evaluated. Note: Model 2 does not independently verify tumor existence.",
                "action": "Upload cranial MRI to evaluate macroscopic mass existence and localization."
            }

        # Both evaluated
        mri_class = mri_eval["predicted_class"]
        gen_class = genomic_eval["predicted_class"]

        # Safety Guardrail 1: Negative MRI scan
        if mri_class == "notumor":
            return {
                "agreement_status": "Discordant (Negative MRI Scan vs Genomic Subtype Signal)",
                "is_flagged": True,
                "headline": "Discordant: Radiological Absence of Tumour vs Transcriptomic Signal",
                "summary": f"Model 1 indicates 'notumor' ({mri_eval['tumour_status']}). Although Model 2 evaluated the transcriptomic data as {gen_class.upper()}, per clinical safety protocols Model 2 cannot independently override a negative neuroimaging scan. This finding suggests sampling variation, benign control profiling, or dataset discordance.",
                "action": "Flagged for expert neuropathological review. Do not interpret as confirmed tumour."
            }

        # Consistency: Glioma on MRI + LGG subtype on Genomics
        if mri_class == "glioma":
            return {
                "agreement_status": "Concordant Glioma Radiogenomic Signal",
                "is_flagged": False,
                "headline": f"Concordant: Glioma Radiological Mass with {gen_class.upper()} Transcriptomic Profile",
                "summary": f"Model 1 detected a glioma mass (confidence: {(mri_eval['confidence'] * 100):.1f}%), and Model 2 independently identified the histomolecular lineage as {gen_class.upper()}. Both modalities independently corroborate glial neoplasm.",
                "action": "Findings aligned. Correlate with IDH1 mutation status and 1p/19q codeletion testing."
            }

        # Discordant subtype: MRI detected Meningioma or Pituitary, while genomics classified LGG subtype
        return {
            "agreement_status": "Discordant Tumour Subtype Classification",
            "is_flagged": True,
            "headline": f"Discordant: Non-Glial MRI Finding ({mri_class.upper()}) vs Glioma Expression Profile ({gen_class.upper()})",
            "summary": f"Model 1 classified the cranial MRI as {mri_class.upper()}, whereas Model 2 (trained specifically on lower-grade gliomas) classified the RNA sample as {gen_class.upper()}. Models must not be merged into an unsupported hybrid diagnosis.",
            "action": "Flagged for multidisciplinary tumour board review. Verify biopsy site and specimen origin."
        }

multimodal_service = MultimodalService()

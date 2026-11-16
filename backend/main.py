import os
from io import BytesIO
from typing import Optional
import json
import pandas as pd
from PIL import Image
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse

from backend.routers import mri
from backend.services.mri_service import mri_service
from backend.services.genomic_service import genomic_service
from backend.services.multimodal_service import multimodal_service
from backend.services.evaluation_service import evaluation_service
from backend.services.report_service import report_service

app = FastAPI(
    title="GeneExpressAI Backend API",
    description="Multimodal Radiogenomics System integrating MRI neuroimaging and TCGA-LGG transcriptomics.",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include MRI Router (keeps MRI endpoints intact)
app.include_router(mri.router)

# -------------------------------------------------------------
# System & Health Status Endpoints
# -------------------------------------------------------------
@app.get("/api/health")
def health_check():
    """System health check and diagnostic overview."""
    return {
        "status": "online",
        "service": "GeneExpressAI API",
        "version": "1.0.0",
        "models": {
            "model_1_mri": mri_service.get_status()["status"],
            "model_2_genomics": genomic_service.get_status()["status"]
        }
    }

@app.get("/api/models/status")
def models_status():
    """Comprehensive status of both diagnostic models and their exact specifications."""
    return {
        "model_1_mri": mri_service.get_status(),
        "model_2_genomics": genomic_service.get_status()
    }

@app.get("/api/model2/status")
@app.get("/api/genomics/status")
def get_model2_status():
    """Status endpoint for Model 2 Genomic GridSearchCV pipeline."""
    return genomic_service.get_status()

# -------------------------------------------------------------
# Model 2 Genomic Prediction Endpoint
# -------------------------------------------------------------
@app.post("/api/model2/predict")
async def predict_genomics(file: UploadFile = File(...)):
    """Predict histological subtype using trained Model 2 pipeline from uploaded CSV."""
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a CSV file."
        )

    try:
        content = await file.read()
        dataframe = pd.read_csv(BytesIO(content))
        result = genomic_service.predict(dataframe)

        if not result["success"]:
            raise HTTPException(
                status_code=422,
                detail=result
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

# -------------------------------------------------------------
# Unified Multimodal Prediction Endpoint
# POST /api/multimodal/analyze
# -------------------------------------------------------------
@app.post("/api/multimodal/analyze")
async def analyze_multimodal(
    mri_file: Optional[UploadFile] = File(None),
    genomic_file: Optional[UploadFile] = File(None),
    patient_ref_id: Optional[str] = Form("PATIENT-UNSPECIFIED")
):
    """
    Executes independent inference for Model 1 (MRI) and Model 2 (Genomics)
    and constructs a unified, cross-validated multimodal report without synthetic fusion.
    """
    if not mri_file and not genomic_file:
        raise HTTPException(
            status_code=400,
            detail="Please provide at least one modality (MRI image or Genomic CSV) to analyze."
        )

    mri_image = None
    mri_filename = None
    if mri_file:
        mri_filename = mri_file.filename
        content = await mri_file.read()
        try:
            mri_image = Image.open(BytesIO(content))
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid MRI image file: {str(e)}"
            )

    genomic_df = None
    genomic_filename = None
    if genomic_file:
        genomic_filename = genomic_file.filename
        if not genomic_filename.lower().endswith(".csv"):
            raise HTTPException(
                status_code=400,
                detail="Genomic file must be in CSV format."
            )
        content = await genomic_file.read()
        try:
            genomic_df = pd.read_csv(BytesIO(content))
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid CSV structure: {str(e)}"
            )

    analysis_result = multimodal_service.analyze(
        mri_image=mri_image,
        mri_filename=mri_filename,
        genomic_df=genomic_df,
        genomic_filename=genomic_filename,
        patient_ref_id=patient_ref_id
    )

    return analysis_result

# -------------------------------------------------------------
# Model Performance Evaluation Endpoints
# -------------------------------------------------------------
@app.get("/api/evaluation/model1")
def get_evaluation_model1():
    """Returns scikit-learn multiclass evaluation metrics for Model 1 MRI ResNet50."""
    return evaluation_service.get_model1_evaluation()

@app.get("/api/evaluation/model2")
def get_evaluation_model2():
    """Returns scikit-learn multiclass evaluation metrics for Model 2 Genomic SVC."""
    return evaluation_service.get_model2_evaluation()

@app.get("/api/evaluation/summary")
def get_evaluation_summary():
    """Returns side-by-side performance metrics and combined evaluation status."""
    return evaluation_service.get_summary()

# -------------------------------------------------------------
# Sample Patient Packages Endpoints
# -------------------------------------------------------------
@app.get("/api/sample-patients")
def list_sample_patients():
    """Lists available paired sample patient demonstration packages."""
    return {
        "packages": [
            {
                "id": "PATIENT-01",
                "patient_reference_id": "TCGA-LGG-DEMO-01",
                "mri_filename": "PATIENT-01_cranial_mri.jpg",
                "genomic_filename": "PATIENT-01_genomic_expression.csv",
                "mri_type": "Glioma",
                "genomic_subtype": "Oligodendroglioma",
                "pairing_status": "Demonstration Paired Package (LGG Glioma)",
                "download_url": "/api/sample-patients/PATIENT-01/download"
            },
            {
                "id": "PATIENT-02",
                "patient_reference_id": "TCGA-LGG-DEMO-02",
                "mri_filename": "PATIENT-02_cranial_mri.jpg",
                "genomic_filename": "PATIENT-02_genomic_expression.csv",
                "mri_type": "Meningioma",
                "genomic_subtype": "Oligodendroglioma",
                "pairing_status": "Demonstration Paired Package (Discordant Review Sample)",
                "download_url": "/api/sample-patients/PATIENT-02/download"
            },
            {
                "id": "PATIENT-03",
                "patient_reference_id": "TCGA-LGG-DEMO-03",
                "mri_filename": "PATIENT-03_cranial_mri.jpg",
                "genomic_filename": "PATIENT-03_genomic_expression.csv",
                "mri_type": "No Tumor",
                "genomic_subtype": "Astrocytoma",
                "pairing_status": "Demonstration Paired Package (Safety Guardrail Sample)",
                "download_url": "/api/sample-patients/PATIENT-03/download"
            }
        ],
        "complete_dataset": {
            "title": "Complete Test Dataset (All 3 Patients)",
            "download_url": "/api/sample-patients/COMPLETE_TEST_DATASET/download"
        },
        "pairing_notice": "Demonstration paired packages provide held-out MRI scans and 20,086-gene TCGA-LGG transcriptomes for workflow testing. True biological patient pairing across public TCGA and Kaggle archives is not claimed."
    }

@app.get("/api/sample-patients/{patient_id}/download")
def download_sample_patient(patient_id: str):
    """Downloads ZIP package for a specific sample patient or complete dataset."""
    valid_ids = ["PATIENT-01", "PATIENT-02", "PATIENT-03", "COMPLETE_TEST_DATASET"]
    if patient_id not in valid_ids:
        raise HTTPException(
            status_code=404,
            detail=f"Sample package '{patient_id}' not found. Available: {valid_ids}"
        )

    zip_path = os.path.join("next-frontend", "public", "sample_packages", f"{patient_id}.zip")
    if not os.path.exists(zip_path):
        raise HTTPException(
            status_code=404,
            detail=f"Package file '{zip_path}' is not present on disk."
        )

    return FileResponse(
        zip_path,
        media_type="application/zip",
        filename=f"{patient_id}.zip"
    )

# -------------------------------------------------------------
# Report Generation Endpoint (PDF)
# POST /api/report/generate
# -------------------------------------------------------------
@app.post("/api/report/generate")
async def generate_report_pdf(payload: dict):
    """
    Generates a complete research PDF report including patient info,
    model 1 predictions, model 2 predictions, combined interpretation,
    confusion matrix summaries, and research disclaimers.
    """
    try:
        pdf_bytes = report_service.generate_pdf(payload)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=GeneExpressAI_Report_{payload.get('patient_info', {}).get('patient_ref_id', 'Patient')}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate analysis PDF report: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)

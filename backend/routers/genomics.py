import io
import pandas as pd
from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from fastapi.responses import JSONResponse
from backend.services.genomic_service import genomic_service

router = APIRouter(tags=["Model 2: TCGA-LGG Genomic Classifier"])

@router.get("/api/model2/status")
@router.get("/api/genomics/status")
def get_model2_status():
    """Returns runtime Model 2 GridSearchCV pipeline status, steps, classes, and capability."""
    return genomic_service.get_status()

@router.post("/api/model2/predict")
@router.post("/api/genomics/predict")
async def predict_genomics(
    file: UploadFile = File(...)
):
    """
    Predict histological subtype from genomic expression matrix (.csv, .tsv, .txt, .cct).
    Preserves exact feature ordering, missing/unexpected feature checks, and pipeline logic.
    Does not refit the pipeline.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes).")

    try:
        sep = "\t" if (file.filename.endswith(".tsv") or file.filename.endswith(".cct") or file.filename.endswith(".txt")) else ","
        df = pd.read_csv(io.BytesIO(content), sep=sep, index_col=0)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV/TSV Parsing Error: {str(e)}")

    result = genomic_service.predict(df)
    if not result.get("success"):
        return JSONResponse(status_code=500 if result.get("error") == "INFERENCE_ERROR" else 422, content=result)

    result["filename"] = file.filename
    return result

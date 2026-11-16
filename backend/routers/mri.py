import io
from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from PIL import Image
from backend.services.mri_service import mri_service

router = APIRouter(tags=["Model 1: MRI Neuroimaging"])

@router.get("/api/model1/status")
@router.get("/api/mri/status")
def get_mri_status():
    """Returns runtime model status, weights availability, architecture, and class mapping."""
    return mri_service.get_status()

@router.post("/api/model1/predict")
@router.post("/api/mri/predict")
async def predict_mri(
    file: UploadFile = File(...),
    sequence: str = Form("T1ce")
):
    """
    Predict brain tumor class from an uploaded MRI scan slice.
    Allowed extensions: .jpg, .jpeg, .png, .dcm, .nii
    Preserves exact training classes: glioma, meningioma, notumor, pituitary.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    filename_lower = file.filename.lower()
    allowed_exts = [".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".dcm", ".nii", ".gz"]
    if not any(filename_lower.endswith(ext) for ext in allowed_exts):
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file format '{file.filename}'. Allowed formats: {allowed_exts}"
        )

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes).")

    # If standard raster image
    try:
        image = Image.open(io.BytesIO(content))
        image.verify()
        # Re-open after verify()
        image = Image.open(io.BytesIO(content))
    except Exception as img_err:
        # Check if DICOM or NIfTI file uploaded
        if filename_lower.endswith(".dcm") or filename_lower.endswith(".nii") or filename_lower.endswith(".gz"):
            return JSONResponse(
                status_code=422,
                content={
                    "success": False,
                    "error": "VOLUMETRIC_EXTRACTION_PENDING",
                    "message": (
                        f"DICOM/NIfTI volume '{file.filename}' received. Direct 3D tensor slicing is staged; "
                        "for 2D slice inference, please upload an extracted PNG/JPG slice or configure 3D radiomics volume."
                    ),
                    "file_details": {
                        "filename": file.filename,
                        "size_bytes": len(content),
                        "sequence": sequence
                    }
                }
            )
        raise HTTPException(status_code=400, detail=f"Invalid or corrupted image file: {str(img_err)}")

    # Delegate to service
    result = mri_service.predict(image)
    if not result.get("success"):
        return JSONResponse(status_code=503, content=result)

    result["sequence_analyzed"] = sequence
    result["filename"] = file.filename
    return result

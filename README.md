# GeneExpressAI - Next.js & React Radiogenomics Platform

GeneExpressAI is an oncology radiogenomics system integrating clinical brain MRI neuroimaging with whole-transcriptome RNA-Seq expression matrices.

The application has been converted to **Next.js (App Router)** and **React 19**, backed by a modular **FastAPI** Python service.

---

## Architecture Overview

```
major proj/
├── backend/                       # Python FastAPI Backend
│   ├── main.py                    # API entrypoint with CORS, health, and status routes
│   ├── routers/                   # Modular endpoint routers
│   │   ├── mri.py                 # POST /api/model1/predict, GET /api/model1/status
│   │   └── genomics.py            # POST /api/model2/predict, GET /api/model2/status
│   ├── services/                  # Machine Learning prediction services
│   │   ├── mri_service.py         # ResNet50 MRI neuroimaging classifier
│   │   └── genomic_service.py     # TCGA-LGG GridSearchCV SVC pipeline (20,086 genes)
│   ├── models/weights/            # Pre-fitted pipelines, encoders, and test samples
│   └── tests/                     # Automated unittest suite
│
├── next-frontend/                 # Modern Next.js App Router Frontend
│   ├── src/
│   │   ├── app/                   # Next.js App Directory
│   │   │   ├── layout.js          # Root clinical dark layout & metadata
│   │   │   ├── page.js            # Main multimodal stateful application
│   │   │   └── globals.css        # Tailwind CSS styling & custom scrollbars
│   │   └── components/            # Modular React components
│   │       ├── Sidebar.jsx        # Navigation sidebar with responsive drawer
│   │       ├── HomePage.jsx       # 3-phase diagnostic protocol & architecture KPIs
│   │       ├── MriUploadSection.jsx # MRI scan upload, slice preview, acquisition parameters
│   │       ├── GenomicCsvUploadSection.jsx # Genomic matrix ingestion & feature validation
│   │       └── ResultsDashboard.jsx # Decoupled Model 1 & Model 2 result cards
│   ├── package.json
│   └── tailwind.config.mjs
│
└── README.md
```

---

## Machine Learning Models & Exact Specifications

### **Model 1: MRI Neuroimaging Classifier**
- **Architecture**: ResNet50 transfer learning base + GlobalAveragePooling2D + Dense(256) + Dropout(0.5) + Dense(4, Softmax)
- **Input Resolution**: `224x224` RGB
- **Classes**: `["glioma", "meningioma", "notumor", "pituitary"]`
- **Endpoint**: `POST http://127.0.0.1:8000/api/model1/predict`

### **Model 2: Genomic Transcriptome Classifier (TCGA-LGG)**
- **Architecture**: Pre-fitted 5-Stage GridSearchCV Pipeline:
  1. `SimpleImputer(strategy="median")`
  2. `VarianceThreshold(threshold=0.01)`
  3. `SelectKBest(score_func=f_classif, k=500)`
  4. `StandardScaler()`
  5. `SVC(C=1, gamma=0.01, kernel='rbf', probability=True, random_state=42)`
- **Feature Space**: 20,086 whole-transcriptome gene symbols
- **Classes**: `["astrocytoma", "oligoastrocytoma", "oligodendroglioma"]`
- **Endpoint**: `POST http://127.0.0.1:8000/api/model2/predict`

---

## Getting Started

### 1. Start the FastAPI Backend

From the workspace root directory:
```powershell
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
*API docs will be running at `http://127.0.0.1:8000/docs`.*

### 2. Start the Next.js Frontend

In a separate terminal:
```powershell
cd next-frontend
npm run dev
```
*Next.js application will be running at `http://localhost:3000`.*

---

## Automated Verification

Run the Python test suite to verify 100% parity between direct pipeline inference and API endpoints:
```powershell
python -m unittest backend/tests/test_e2e.py
```
To run the Next.js production build:
```powershell
cd next-frontend
npm run build
```

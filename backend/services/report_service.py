"""
Report Service for GeneExpressAI
Generates a comprehensive clinical-grade research PDF report summarizing:
- Patient & Sample Metadata
- Model 1 MRI Classification & Probabilities
- Model 2 Genomic Classification & Calibration
- Combined Multimodal Interpretation & Alignment Status
- Benchmark Model Evaluation Metrics & Confusion Matrices
- Research Limitations & Clinical Disclaimers
"""

from io import BytesIO
from typing import Dict, Any
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable
)
from backend.services.evaluation_service import evaluation_service

class ReportService:
    def generate_pdf(self, analysis_data: Dict[str, Any]) -> bytes:
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom palette styling
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=18,
            leading=22,
            textColor=colors.HexColor('#0f172a'),
            spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            'DocSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#475569')
        )
        section_heading = ParagraphStyle(
            'SectionHead',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            textColor=colors.HexColor('#1e293b'),
            spaceBefore=10,
            spaceAfter=4
        )
        body_style = ParagraphStyle(
            'DocBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#334155')
        )
        bold_body = ParagraphStyle(
            'DocBoldBody',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#0f172a')
        )
        disclaimer_style = ParagraphStyle(
            'DocDisclaimer',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=7,
            leading=9,
            textColor=colors.HexColor('#64748b')
        )

        story = []

        # -------------------------------------------------------------
        # Header / Banner
        # -------------------------------------------------------------
        story.append(Paragraph("GeneExpressAI — Multimodal Radiogenomics Analysis Report", title_style))
        story.append(Paragraph("Computational Neuro-Oncology Research System • Independent Dual-Modality Evaluation", subtitle_style))
        story.append(Spacer(1, 6))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284c7'), spaceAfter=8))

        patient_info = analysis_data.get("patient_info", {})
        mri_analysis = analysis_data.get("mri_analysis", {})
        genomic_analysis = analysis_data.get("genomic_analysis", {})
        combined_interp = analysis_data.get("combined_interpretation", {})
        overall = analysis_data.get("overall_result", {})

        # -------------------------------------------------------------
        # Section A: Patient & Session Metadata
        # -------------------------------------------------------------
        meta_table_data = [
            [
                Paragraph("<b>Patient Reference ID:</b>", body_style),
                Paragraph(patient_info.get("patient_ref_id", "PATIENT-DEMO-UNSPECIFIED"), bold_body),
                Paragraph("<b>Analysis Timestamp:</b>", body_style),
                Paragraph(patient_info.get("timestamp", "N/A"), body_style)
            ],
            [
                Paragraph("<b>MRI Scan File:</b>", body_style),
                Paragraph(patient_info.get("mri_filename", "None"), body_style),
                Paragraph("<b>Genomic CSV File:</b>", body_style),
                Paragraph(patient_info.get("genomic_filename", "None"), body_style)
            ]
        ]
        meta_table = Table(meta_table_data, colWidths=[120, 150, 110, 160])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('PADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 10))

        # -------------------------------------------------------------
        # Section B & C: Independent Model Predictions (Side-by-side Table)
        # -------------------------------------------------------------
        story.append(Paragraph("Independent Model Inference Results", section_heading))

        mri_pred_class = mri_analysis.get("predicted_class", "Not evaluated").upper()
        mri_conf_str = f"{(mri_analysis.get('confidence', 0) * 100):.1f}%" if mri_analysis.get("confidence") else "N/A"
        mri_status_str = mri_analysis.get("tumour_status", "Not evaluated")

        gen_pred_class = genomic_analysis.get("predicted_class", "Not evaluated").upper()
        gen_samples_str = str(genomic_analysis.get("number_of_samples", "N/A"))
        gen_status_str = "Evaluated (20,086 Genes)" if genomic_analysis.get("evaluated") else "Not evaluated"

        models_table_data = [
            [
                Paragraph("<b>Model 1: MRI Neuroimaging (ResNet50)</b>", bold_body),
                Paragraph("<b>Model 2: Genomic Transcriptome (SVC)</b>", bold_body)
            ],
            [
                Paragraph(f"<b>Predicted Class:</b> {mri_pred_class}", body_style),
                Paragraph(f"<b>Predicted Subtype:</b> {gen_pred_class}", body_style)
            ],
            [
                Paragraph(f"<b>Tumour Status:</b> {mri_status_str}", body_style),
                Paragraph(f"<b>Samples Analysed:</b> {gen_samples_str}", body_style)
            ],
            [
                Paragraph(f"<b>Softmax Confidence:</b> {mri_conf_str}", body_style),
                Paragraph(f"<b>Validation Status:</b> {gen_status_str}", body_style)
            ]
        ]
        models_table = Table(models_table_data, colWidths=[270, 270])
        models_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,0), colors.HexColor('#f0f9ff')),
            ('BACKGROUND', (1,0), (1,0), colors.HexColor('#faf5ff')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('PADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(models_table)
        story.append(Spacer(1, 10))

        # -------------------------------------------------------------
        # Section D: Combined Interpretation
        # -------------------------------------------------------------
        story.append(Paragraph("Combined Multimodal Interpretation & Alignment", section_heading))
        interp_box_data = [
            [
                Paragraph(f"<b>Alignment Status:</b> {combined_interp.get('agreement_status', 'Evaluated')}", bold_body)
            ],
            [
                Paragraph(f"<b>Findings Summary:</b> {combined_interp.get('summary', 'Independent evaluation complete.')}", body_style)
            ],
            [
                Paragraph(f"<b>Recommended Clinical Action:</b> {combined_interp.get('action', 'Verify with clinical tumor board.')}", body_style)
            ]
        ]
        interp_box = Table(interp_box_data, colWidths=[540])
        box_bg = colors.HexColor('#fef3c7') if combined_interp.get("is_flagged") else colors.HexColor('#f1f5f9')
        interp_box.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), box_bg),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#94a3b8')),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(interp_box)
        story.append(Spacer(1, 10))

        # -------------------------------------------------------------
        # Section E: Benchmark Model Performance Metrics (sklearn)
        # -------------------------------------------------------------
        story.append(Paragraph("Model Benchmark Performance & Evaluation (Held-out Test Cohorts)", section_heading))

        m1_eval = evaluation_service.get_model1_evaluation()
        m2_eval = evaluation_service.get_model2_evaluation()

        perf_table_data = [
            [
                Paragraph("<b>Evaluation Metric</b>", bold_body),
                Paragraph("<b>Model 1 (ResNet50 MRI)</b>", bold_body),
                Paragraph("<b>Model 2 (SVC Genomics)</b>", bold_body)
            ],
            [
                Paragraph("Test Accuracy", body_style),
                Paragraph(f"{m1_eval['accuracy'] * 100:.2f}%", body_style),
                Paragraph(f"{m2_eval['accuracy'] * 100:.2f}%", body_style)
            ],
            [
                Paragraph("Weighted Precision", body_style),
                Paragraph(f"{m1_eval['precision_weighted'] * 100:.2f}%", body_style),
                Paragraph(f"{m2_eval['precision_weighted'] * 100:.2f}%", body_style)
            ],
            [
                Paragraph("Weighted Recall", body_style),
                Paragraph(f"{m1_eval['recall_weighted'] * 100:.2f}%", body_style),
                Paragraph(f"{m2_eval['recall_weighted'] * 100:.2f}%", body_style)
            ],
            [
                Paragraph("Weighted F1-Score", body_style),
                Paragraph(f"{m1_eval['f1_weighted'] * 100:.2f}%", body_style),
                Paragraph(f"{m2_eval['f1_weighted'] * 100:.2f}%", body_style)
            ],
            [
                Paragraph("Held-out Test Cohort", body_style),
                Paragraph(f"{m1_eval['sample_count']} MRI images", body_style),
                Paragraph(f"{m2_eval['sample_count']} RNA-Seq samples", body_style)
            ]
        ]
        perf_table = Table(perf_table_data, colWidths=[180, 180, 180])
        perf_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e2e8f0')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('PADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(perf_table)
        story.append(Spacer(1, 10))

        # -------------------------------------------------------------
        # Section F: Limitations & Clinical Disclaimer
        # -------------------------------------------------------------
        story.append(Paragraph("Limitations & Research Disclaimer", section_heading))
        disclaimer_text = (
            "<b>RESEARCH PROTOTYPE ONLY — NOT INTENDED FOR PRIMARY CLINICAL DIAGNOSIS.</b><br/>"
            "GeneExpressAI is an investigational decision-support research framework. Outputs from Model 1 and Model 2 "
            "are calculated independently without synthetic fusion. Softmax confidence scores indicate algorithmic probability "
            "distributions across trained classes and must never be interpreted as clinical diagnostic certainty. "
            "All findings must be independently validated by board-certified radiologists, neuropathologists, and medical oncologists."
        )
        story.append(Paragraph(disclaimer_text, disclaimer_style))

        # Build document
        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes

report_service = ReportService()

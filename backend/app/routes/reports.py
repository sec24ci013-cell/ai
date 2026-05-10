"""Reports Routes — CRUD for generated investigation reports."""
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from beanie import Document, PydanticObjectId
from app.models.user import User
from app.utils.security import get_current_user


from app.models.report import Report


class ReportCreate(BaseModel):
    case_id: str
    report_type: str = "legal"
    title: str = ""


class ReportOut(BaseModel):
    id: PydanticObjectId
    case_id: PydanticObjectId
    title: str
    report_type: str
    content: str
    pages: int
    status: str
    created_at: datetime


router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post("", response_model=ReportOut)
async def generate_report(req: ReportCreate, current_user: User = Depends(get_current_user)):
    """Generate a new investigation report using AI agents."""
    from app.models.case import Case
    from app.models.evidence import Evidence

    case = await Case.get(PydanticObjectId(req.case_id))
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    title = req.title or f"{case.title} — {req.report_type.title()} Report"

    report = Report(
        case_id=PydanticObjectId(req.case_id),
        title=title,
        report_type=req.report_type,
        status="generating",
        created_by=current_user.id,
    )
    await report.insert()

    # Generate report content based on type
    try:
        evidence_list = await Evidence.find(Evidence.case_id == PydanticObjectId(req.case_id)).to_list()

        if req.report_type == "legal":
            from app.ai.legal_report_agent import generate_legal_report
            case_data = {
                "case_id": req.case_id,
                "crime_type": case.crime_type,
                "suspects": [],
                "evidence": [{"type": e.type, "summary": e.ai_summary or ""} for e in evidence_list],
                "risk_score": case.risk_score,
            }
            content = generate_legal_report(case_data)
        elif req.report_type == "evidence":
            from app.ai.evidence_agent import analyze_evidence
            summaries = [{"type": e.type, "summary": e.ai_summary or "Not analyzed"} for e in evidence_list]
            content = analyze_evidence(req.case_id, summaries)
        elif req.report_type == "timeline":
            from app.ai.timeline_agent import reconstruct_timeline
            from app.models.timeline import TimelineEvent
            events = await TimelineEvent.find(TimelineEvent.case_id == PydanticObjectId(req.case_id)).sort("timestamp").to_list()
            event_data = [{"timestamp": str(e.timestamp), "event_type": e.event_type, "description": e.description or ""} for e in events]
            content = reconstruct_timeline(req.case_id, event_data)
        else:
            from app.services.llm_client import chat_completion
            content = chat_completion([
                {"role": "system", "content": f"Generate a {req.report_type} investigation report for case: {case.title} ({case.crime_type})"},
                {"role": "user", "content": f"Evidence items: {len(evidence_list)}. Risk score: {case.risk_score}. Generate a detailed report."}
            ])

        # Estimate pages (roughly 250 words per page)
        word_count = len(content.split()) if isinstance(content, str) else 0
        pages = max(1, word_count // 250)

        report.content = content if isinstance(content, str) else str(content)
        report.pages = pages
        report.status = "complete"
    except Exception as e:
        report.content = f"Report generation failed: {str(e)}"
        report.status = "failed"

    await report.save()
    return report


@router.get("", response_model=List[ReportOut])
async def list_reports(case_id: str = None, current_user: User = Depends(get_current_user)):
    """List all reports, optionally filtered by case."""
    if case_id:
        reports = await Report.find(Report.case_id == PydanticObjectId(case_id)).sort("-created_at").to_list()
    else:
        reports = await Report.find_all().sort("-created_at").to_list()
    return reports


@router.get("/{report_id}", response_model=ReportOut)
async def get_report(report_id: PydanticObjectId, current_user: User = Depends(get_current_user)):
    """Get a specific report."""
    report = await Report.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.delete("/{report_id}")
async def delete_report(report_id: PydanticObjectId, current_user: User = Depends(get_current_user)):
    """Delete a report."""
    report = await Report.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    await report.delete()
    return {"message": "Report deleted"}

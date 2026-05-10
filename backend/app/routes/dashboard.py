"""Dashboard Stats Route — Aggregated metrics for the frontend dashboard."""
from fastapi import APIRouter, Depends
from app.models.case import Case
from app.models.evidence import Evidence
from app.models.timeline import TimelineEvent
from app.models.user import User
from app.utils.security import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    """Aggregate metrics for the main dashboard."""
    cases = await Case.find_all().to_list()
    evidence_list = await Evidence.find_all().to_list()
    timeline_events = await TimelineEvent.find_all().to_list()

    total_cases = len(cases)
    open_cases = len([c for c in cases if c.status == "open"])
    total_evidence = len(evidence_list)
    processing_evidence = len([e for e in evidence_list if e.ai_status == "processing"])
    total_events = len(timeline_events)

    # Risk distribution
    high_risk = len([c for c in cases if c.risk_score > 70])
    medium_risk = len([c for c in cases if 40 < c.risk_score <= 70])
    low_risk = len([c for c in cases if c.risk_score <= 40])

    # Evidence by type
    type_counts = {}
    for e in evidence_list:
        t = e.type or "unknown"
        type_counts[t] = type_counts.get(t, 0) + 1

    # Recent cases
    recent_cases = sorted(cases, key=lambda c: c.created_at, reverse=True)[:5]
    recent_cases_data = [
        {
            "id": str(c.id),
            "title": c.title,
            "crime_type": c.crime_type,
            "status": c.status,
            "risk_score": c.risk_score,
            "created_at": c.created_at.isoformat(),
        }
        for c in recent_cases
    ]

    return {
        "total_cases": total_cases,
        "open_cases": open_cases,
        "total_evidence": total_evidence,
        "processing_evidence": processing_evidence,
        "total_events": total_events,
        "high_risk_cases": high_risk,
        "medium_risk_cases": medium_risk,
        "low_risk_cases": low_risk,
        "evidence_by_type": type_counts,
        "recent_cases": recent_cases_data,
    }

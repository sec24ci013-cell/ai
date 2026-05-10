"""Agent Execution Routes — Evidence, Timeline, Legal Report, Risk Score."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from beanie import PydanticObjectId
from app.models.case import Case
from app.models.evidence import Evidence
from app.models.timeline import TimelineEvent

router = APIRouter(prefix="/agents", tags=["AI Agents"])


@router.post("/evidence/{case_id}")
async def run_evidence_agent(case_id: str):
    """Run evidence analysis agent on all evidence for a case."""
    evidence_list = await Evidence.find(Evidence.case_id == PydanticObjectId(case_id)).to_list()
    summaries = [{"type": e.type, "summary": e.ai_summary or "Not analyzed"} for e in evidence_list]

    from app.ai.evidence_agent import analyze_evidence
    result = analyze_evidence(case_id, summaries)
    return {"case_id": case_id, "agent": "evidence_agent", "analysis": result}


@router.post("/timeline/{case_id}")
async def run_timeline_agent(case_id: str):
    """Run timeline reconstruction agent on case events."""
    events = await TimelineEvent.find(TimelineEvent.case_id == PydanticObjectId(case_id)).sort("timestamp").to_list()
    event_data = [{"timestamp": str(e.timestamp), "event_type": e.event_type, "description": e.description or ""} for e in events]

    from app.ai.timeline_agent import reconstruct_timeline
    result = reconstruct_timeline(case_id, event_data)
    return {"case_id": case_id, "agent": "timeline_agent", "analysis": result}


@router.post("/legal-report/{case_id}")
async def run_legal_report_agent(case_id: str):
    """Generate legal investigation report for a case."""
    case = await Case.get(PydanticObjectId(case_id))
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    evidence_list = await Evidence.find(Evidence.case_id == PydanticObjectId(case_id)).to_list()

    case_data = {
        "case_id": case_id,
        "crime_type": case.crime_type,
        "suspects": [],  # Populated from graph if available
        "evidence": [{"type": e.type, "summary": e.ai_summary or ""} for e in evidence_list],
        "risk_score": case.risk_score,
    }

    from app.ai.legal_report_agent import generate_legal_report
    result = generate_legal_report(case_data)
    return {"case_id": case_id, "agent": "legal_report_agent", "report": result}


@router.get("/risk/{case_id}")
async def get_risk_score(case_id: str):
    """Calculate and update risk score for a case."""
    case = await Case.get(PydanticObjectId(case_id))
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    evidence_list = await Evidence.find(Evidence.case_id == PydanticObjectId(case_id)).to_list()
    timeline_events = await TimelineEvent.find(TimelineEvent.case_id == PydanticObjectId(case_id)).to_list()

    case_data = {
        "evidence": [{"ai_summary": e.ai_summary or ""} for e in evidence_list],
        "timeline_events": [{"timestamp": e.timestamp.timestamp()} for e in timeline_events],
        "graph": {"nodes": [], "edges": []}
    }

    from app.services.risk_service import calculate_risk_score
    result = calculate_risk_score(case_data)

    # Save back to MongoDB
    case.risk_score = result["score"]
    case.ai_risk_level = result["risk_level"]
    case.ai_risk_flags = result["flags"]
    case.ai_risk_recommendation = result["recommendation"]
    await case.save()

    return {"case_id": case_id, **result}


@router.post("/autopsy/{case_id}")
async def run_autopsy_agent(case_id: str, report_text: str = ""):
    """Run autopsy intelligence agent on a medical/forensic report."""
    if not report_text:
        # Try to get autopsy evidence from the case
        evidence_list = await Evidence.find(Evidence.case_id == PydanticObjectId(case_id)).to_list()
        autopsy_evidence = [e for e in evidence_list if "autopsy" in (e.type or "").lower() or "medical" in (e.type or "").lower()]
        if autopsy_evidence and autopsy_evidence[0].ai_raw_text:
            report_text = autopsy_evidence[0].ai_raw_text
        else:
            report_text = " | ".join([e.ai_summary or "" for e in evidence_list if e.ai_summary])

    from app.ai.autopsy_agent import analyze_autopsy
    result = analyze_autopsy(case_id, report_text)
    return {"case_id": case_id, "agent": "autopsy_agent", "analysis": result}


@router.post("/graph/{case_id}")
async def run_graph_agent(case_id: str):
    """Run graph intelligence agent to analyze relationship networks."""
    try:
        from app.services.graph_service import get_full_case_graph
        graph_data = get_full_case_graph(case_id)
    except Exception:
        graph_data = {"nodes": [], "edges": []}

    from app.ai.graph_agent import analyze_graph
    result = analyze_graph(case_id, graph_data.get("nodes", []), graph_data.get("edges", []))
    return {"case_id": case_id, "agent": "graph_agent", "analysis": result}


class ToDRequest(BaseModel):
    body_temp_celsius: float = 32.0
    ambient_temp_celsius: float = 22.0
    body_weight_kg: float = 70.0
    rigor_mortis: str = "developing"  # absent | developing | full | passing | resolved
    livor_mortis: str = "faint_blanching"  # absent | faint_blanching | developed_blanching | fixed
    clothing: str = "normal"  # naked | light | normal | heavy
    scene_discovery_time: str = ""
    additional_observations: str = ""


@router.post("/tod/{case_id}")
async def run_tod_agent(case_id: str, req: ToDRequest):
    """Run Time-of-Death estimation agent using postmortem indicators."""
    case = await Case.get(PydanticObjectId(case_id))
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    from app.ai.tod_agent import estimate_time_of_death
    params = req.model_dump()
    result = estimate_time_of_death(case_id, params)
    return {"case_id": case_id, "agent": "tod_agent", "analysis": result, "input_params": params}


@router.post("/face-sketch/{case_id}")
async def run_face_sketch_agent(case_id: str):
    """Generate suspect face composite description from witness statements in evidence."""
    evidence_list = await Evidence.find(Evidence.case_id == PydanticObjectId(case_id)).to_list()
    witness_text = " | ".join([e.ai_summary or "" for e in evidence_list if e.ai_summary])

    from app.services.llm_client import chat_completion
    result = chat_completion([
        {"role": "system", "content": "You are a forensic facial composite specialist. Based on witness statements "
         "and evidence summaries, generate a detailed textual description of the suspect's facial features. "
         "Include: face shape, hair (color/style/length), eyes (color/shape), nose, mouth, chin, "
         "distinguishing marks (scars, tattoos, moles), estimated age range, skin tone, and build. "
         "Format as a structured suspect profile that could be used by a forensic sketch artist."},
        {"role": "user", "content": f"Case ID: {case_id}\nEvidence summaries:\n{witness_text[:4000]}"}
    ])
    return {"case_id": case_id, "agent": "face_sketch_agent", "analysis": result}


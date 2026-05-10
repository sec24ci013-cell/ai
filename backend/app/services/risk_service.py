"""Risk Scoring Engine — Rule-based assessment + Anomaly Detection."""


def calculate_risk_score(case_data: dict) -> dict:
    score = 0
    flags = []
    evidence_list = case_data.get("evidence", [])
    timeline_events = case_data.get("timeline_events", [])
    graph_data = case_data.get("graph", {})

    # --- EVIDENCE VOLUME ---
    if len(evidence_list) > 20:
        score += 15; flags.append("High evidence volume — complex case")
    elif len(evidence_list) > 10:
        score += 8; flags.append("Moderate evidence volume")

    # --- SUSPECT NETWORK ---
    suspects = [n for n in graph_data.get("nodes", []) if n.get("type") == "Person"]
    if len(suspects) > 5:
        score += 25; flags.append(f"{len(suspects)} connected individuals — organized network")
    elif len(suspects) > 3:
        score += 20; flags.append(f"{len(suspects)} connected individuals detected")

    # --- KEYWORD ANALYSIS ---
    financial_kw = ["transfer", "payment", "cash", "bank", "transaction", "money", "fraud", "laundering"]
    violence_kw = ["weapon", "knife", "gun", "threat", "attack", "assault", "murder", "homicide", "stab", "shoot"]
    drug_kw = ["drug", "narcotic", "fentanyl", "cocaine", "heroin", "meth", "overdose", "toxicology"]
    forensic_kw = ["autopsy", "postmortem", "decomposition", "cause of death", "blunt force", "asphyxiation"]

    all_summaries = " ".join([(ev.get("ai_summary") or "").lower() for ev in evidence_list])

    if any(kw in all_summaries for kw in financial_kw):
        score += 10; flags.append("Financial crime indicators detected")
    if any(kw in all_summaries for kw in violence_kw):
        score += 25; flags.append("Weapon or violence evidence present")
    if any(kw in all_summaries for kw in drug_kw):
        score += 15; flags.append("Drug/toxicology indicators detected")
    if any(kw in all_summaries for kw in forensic_kw):
        score += 10; flags.append("Forensic/postmortem evidence present")

    # --- ANOMALY DETECTION ---

    # 1. Timeline gap anomaly — large unexplained time gaps
    if len(timeline_events) >= 2:
        timestamps = sorted([e.get("timestamp", 0) for e in timeline_events if isinstance(e.get("timestamp"), (int, float))])
        if len(timestamps) >= 2:
            max_gap = max(timestamps[i+1] - timestamps[i] for i in range(len(timestamps)-1))
            if max_gap > 86400:  # > 24 hours gap
                score += 10; flags.append(f"Timeline anomaly: {max_gap // 3600:.0f}h unexplained gap between events")

    # 2. Cross-entity anomaly — same person appears in many evidence items
    entity_frequency = {}
    for ev in evidence_list:
        entities = ev.get("ai_entities") or {}
        for person in entities.get("persons", []):
            entity_frequency[person] = entity_frequency.get(person, 0) + 1
    
    frequent_entities = {k: v for k, v in entity_frequency.items() if v >= 3}
    if frequent_entities:
        top = max(frequent_entities, key=frequent_entities.get)
        score += 10; flags.append(f"Cross-evidence correlation: '{top}' appears in {frequent_entities[top]} evidence items")

    # 3. Evidence type imbalance — many items of one type (could indicate data dump)
    type_counts = {}
    for ev in evidence_list:
        t = ev.get("type", "unknown")
        type_counts[t] = type_counts.get(t, 0) + 1
    if type_counts:
        dominant_type = max(type_counts, key=type_counts.get)
        if type_counts[dominant_type] > len(evidence_list) * 0.7 and len(evidence_list) > 5:
            score += 5; flags.append(f"Evidence imbalance: {type_counts[dominant_type]}/{len(evidence_list)} items are '{dominant_type}'")

    risk_level = "LOW" if score < 30 else "MEDIUM" if score < 60 else "HIGH" if score < 80 else "CRITICAL"
    recs = {
        "LOW": "Standard investigation protocols apply. Continue evidence collection.",
        "MEDIUM": "Prioritize evidence review. Additional forensic analysis recommended.",
        "HIGH": "Immediate senior review required. Forensic lab prioritization needed.",
        "CRITICAL": "URGENT — Escalate immediately. Full task force deployment recommended. Preserve all evidence chains."
    }
    return {"score": min(score, 100), "risk_level": risk_level, "flags": list(set(flags)),
            "recommendation": recs.get(risk_level, "")}

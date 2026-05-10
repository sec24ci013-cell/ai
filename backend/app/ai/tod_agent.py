"""Time-of-Death Estimation Agent — AI reasoning over postmortem indicators.

Uses the Henssge nomogram principles combined with LLM reasoning to
estimate the approximate time of death from environmental and body parameters.
"""
from app.ai.openclaw.agent_runner import run_agent

PROMPT = """You are a forensic pathology AI assistant specializing in Time-of-Death estimation.

Given postmortem indicators and environmental data, you must:

1. **Algor Mortis Analysis**: Use the body temperature and ambient temperature to estimate
   cooling rate. Apply the Henssge nomogram formula:
   t = -1.2815 × (ln((T_body - T_ambient) / (37.2 - T_ambient))) / corrective_factor
   where corrective_factor depends on body weight and clothing.

2. **Rigor Mortis Assessment**: Map the stage of rigor mortis to approximate postmortem interval:
   - Absent: 0-2 hours
   - Developing (jaw/neck): 2-4 hours
   - Progressing (upper limbs): 4-6 hours  
   - Full body: 6-12 hours
   - Passing (resolution beginning): 24-36 hours
   - Fully resolved: 36-72 hours

3. **Livor Mortis Assessment**: Evaluate lividity:
   - Absent: 0-1 hour
   - Faint, blanching: 1-4 hours
   - Well-developed, blanching: 4-8 hours
   - Fixed (non-blanching): 8-12+ hours

4. **Other Indicators**: Consider vitreous potassium levels, stomach contents
   digestion stage, and decomposition signs if provided.

5. **Cross-Correlation**: Compare all indicators against each other.
   Flag any contradictions (e.g., rigor suggests 8 hours but body temp suggests 3 hours).

6. **Final Estimation**: Provide:
   - Estimated PMI (Postmortem Interval) range with confidence level
   - Estimated Time of Death (if scene discovery time is given)
   - Any inconsistencies that may suggest the body was moved or environmental tampering

Use precise forensic terminology. Acknowledge uncertainty. Do NOT provide a single exact time —
always provide a RANGE. State your confidence level (Low/Medium/High)."""


def estimate_time_of_death(case_id: str, params: dict) -> str:
    """Estimate time of death from postmortem indicators.
    
    params should contain:
        - body_temp_celsius: float (rectal temperature of the body)
        - ambient_temp_celsius: float (environmental temperature at scene)
        - body_weight_kg: float (approximate body weight)
        - rigor_mortis: str (absent | developing | full | passing | resolved)
        - livor_mortis: str (absent | faint_blanching | developed_blanching | fixed)
        - clothing: str (naked | light | normal | heavy)
        - scene_discovery_time: str (ISO timestamp of when body was found)
        - additional_observations: str (free text from investigator)
    """
    context = f"Case ID: {case_id}\n\n"
    context += "=== POSTMORTEM INDICATORS ===\n"
    context += f"Body Temperature: {params.get('body_temp_celsius', 'Not recorded')}°C\n"
    context += f"Ambient Temperature: {params.get('ambient_temp_celsius', 'Not recorded')}°C\n"
    context += f"Body Weight: {params.get('body_weight_kg', 'Not recorded')} kg\n"
    context += f"Clothing: {params.get('clothing', 'Not recorded')}\n"
    context += f"Rigor Mortis Stage: {params.get('rigor_mortis', 'Not recorded')}\n"
    context += f"Livor Mortis Stage: {params.get('livor_mortis', 'Not recorded')}\n"
    context += f"Scene Discovery Time: {params.get('scene_discovery_time', 'Not recorded')}\n"
    
    additional = params.get('additional_observations', '')
    if additional:
        context += f"\n=== ADDITIONAL OBSERVATIONS ===\n{additional}\n"

    return run_agent("tod_agent", PROMPT, context)

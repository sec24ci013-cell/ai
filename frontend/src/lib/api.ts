/**
 * RAW Investigation OS — API Client
 * Centralized fetch wrapper for all backend API calls.
 */

const API_BASE = "/api/v1";

/** Get stored JWT token */
function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("raw_token");
}

/** Set stored JWT token */
export function setToken(token: string): void {
    localStorage.setItem("raw_token", token);
}

/** Clear stored JWT token */
export function clearToken(): void {
    localStorage.removeItem("raw_token");
}

/** Check if user is authenticated */
export function isAuthenticated(): boolean {
    return !!getToken();
}

/** Build headers with optional auth */
function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = { ...extra };
    const token = getToken();
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
}

/** Generic API request */
async function request<T = unknown>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE}${path}`;
    const headers = authHeaders(
        options.body instanceof FormData
            ? {}
            : { "Content-Type": "application/json" }
    );

    const res = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } });

    if (res.status === 401) {
        clearToken();
        if (typeof window !== "undefined") {
            window.location.href = "/login";
        }
        throw new Error("Unauthorized");
    }

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `API Error: ${res.status}`);
    }

    return res.json();
}

// ===== AUTH =====

export interface LoginResponse {
    access_token: string;
    token_type: string;
}

export interface UserOut {
    id: string;
    name: string;
    email: string;
    role: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Login failed" }));
        throw new Error(err.detail || "Login failed");
    }
    const data: LoginResponse = await res.json();
    setToken(data.access_token);
    return data;
}

export async function register(name: string, email: string, password: string, role = "officer"): Promise<UserOut> {
    return request<UserOut>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, role }),
    });
}

export async function logout(): Promise<void> {
    try {
        await request("/auth/logout", { method: "POST" });
    } finally {
        clearToken();
    }
}

export async function getUsers(): Promise<UserOut[]> {
    return request<UserOut[]>("/auth/users");
}

export async function updateUserRole(userId: string, role: string): Promise<UserOut> {
    return request<UserOut>(`/auth/users/${userId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role }),
    });
}

// ===== DASHBOARD =====

export interface DashboardStats {
    total_cases: number;
    open_cases: number;
    total_evidence: number;
    processing_evidence: number;
    total_events: number;
    high_risk_cases: number;
    medium_risk_cases: number;
    low_risk_cases: number;
    evidence_by_type: Record<string, number>;
    recent_cases: Array<{
        id: string;
        title: string;
        crime_type: string;
        status: string;
        risk_score: number;
        created_at: string;
    }>;
}

export async function getDashboardStats(): Promise<DashboardStats> {
    return request<DashboardStats>("/dashboard/stats");
}

// ===== CASES =====

export interface CaseOut {
    id: string;
    title: string;
    crime_type: string;
    status: string;
    risk_score: number;
    created_at: string;
    assignee_id?: string;
    ai_risk_level?: string;
    ai_risk_flags?: string[];
    ai_risk_recommendation?: string;
}

export async function listCases(): Promise<CaseOut[]> {
    return request<CaseOut[]>("/cases");
}

export async function getCase(id: string): Promise<CaseOut> {
    return request<CaseOut>(`/cases/${id}`);
}

export async function createCase(title: string, crimeType: string): Promise<CaseOut> {
    return request<CaseOut>("/cases", {
        method: "POST",
        body: JSON.stringify({ title, crime_type: crimeType }),
    });
}

export async function updateCase(id: string, data: { status?: string; risk_score?: number; assignee_id?: string }): Promise<CaseOut> {
    return request<CaseOut>(`/cases/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

// ===== EVIDENCE =====

export interface EvidenceItem {
    id: string;
    case_id: string;
    type: string;
    hash: string;
    path: string;
    timestamp: string;
    ai_summary?: string;
    ai_entities?: Record<string, unknown>;
    ai_raw_text?: string;
    ai_status: string;
}

export async function uploadEvidence(caseId: string, type: string, file: File): Promise<{ evidence_id: string; hash: string; ai_status: string }> {
    const form = new FormData();
    form.append("case_id", caseId);
    form.append("type", type);
    form.append("file", file);
    return request("/evidence/upload", { method: "POST", body: form });
}

export async function getCaseEvidence(caseId: string): Promise<EvidenceItem[]> {
    return request<EvidenceItem[]>(`/evidence/case/${caseId}`);
}

export async function getEvidence(id: string): Promise<EvidenceItem> {
    return request<EvidenceItem>(`/evidence/${id}`);
}

// ===== AI ANALYSIS =====

export async function triggerAIAnalysis(evidenceId: string, caseId: string): Promise<{ status: string }> {
    return request("/ai/analyze/evidence", {
        method: "POST",
        body: JSON.stringify({ evidence_id: evidenceId, case_id: caseId }),
    });
}

export async function getAIStatus(evidenceId: string): Promise<{ ai_status: string; ai_summary?: string; ai_entities?: Record<string, unknown> }> {
    return request(`/ai/status/${evidenceId}`);
}

// ===== COPILOT =====

export async function askCopilotStream(
    caseId: string,
    question: string,
    history: Array<{ question: string; answer: string }>,
    onToken: (token: string) => void,
    onDone: () => void
): Promise<void> {
    const res = await fetch(`${API_BASE}/copilot/ask`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
        },
        body: JSON.stringify({
            case_id: caseId,
            question,
            conversation_history: history,
        }),
    });

    if (!res.ok) throw new Error("Copilot request failed");

    const reader = res.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
            if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                if (data === "[DONE]") {
                    onDone();
                    return;
                }
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.token) onToken(parsed.token);
                } catch { /* skip malformed SSE */ }
            }
        }
    }
    onDone();
}

export async function askCopilotFull(
    caseId: string,
    question: string,
    history: Array<{ question: string; answer: string }>
): Promise<{ answer: string }> {
    return request("/copilot/ask/full", {
        method: "POST",
        body: JSON.stringify({ case_id: caseId, question, conversation_history: history }),
    });
}

// ===== SEARCH =====

export async function searchSemantic(query: string, caseId?: string, topK = 5): Promise<{ results: unknown[]; total: number }> {
    return request("/search/semantic", {
        method: "POST",
        body: JSON.stringify({ query, case_id: caseId, top_k: topK }),
    });
}

export async function searchKeyword(q: string, caseId?: string): Promise<{ results: unknown[] }> {
    const params = new URLSearchParams({ q });
    if (caseId) params.set("case_id", caseId);
    return request(`/search/keyword?${params.toString()}`);
}

// ===== GRAPH =====

export async function getCaseGraph(caseId: string): Promise<{
    nodes: Array<{ name: string; type: string; properties?: Record<string, unknown> }>;
    edges: Array<{ source: string; target: string; relationship: string }>;
}> {
    return request(`/graph/case/${caseId}`);
}

export async function getSuspectConnections(name: string): Promise<{ connections: unknown[] }> {
    return request(`/graph/suspect/${encodeURIComponent(name)}`);
}

export async function getMastermind(caseId: string): Promise<{ top_suspects: unknown[] }> {
    return request(`/graph/mastermind/${caseId}`);
}

export async function addRelationship(data: {
    source_name: string;
    source_type?: string;
    target_name: string;
    target_type?: string;
    relationship?: string;
}): Promise<unknown> {
    return request("/graph/add-relationship", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

// ===== TIMELINE =====

export interface TimelineEventOut {
    id: string;
    case_id: string;
    timestamp: string;
    event_type: string;
    confidence_score: number;
    description?: string;
}

export async function getCaseTimeline(caseId: string): Promise<TimelineEventOut[]> {
    return request<TimelineEventOut[]>(`/timeline/${caseId}`);
}

export async function createTimelineEvent(data: {
    case_id: string;
    event_type: string;
    confidence_score?: number;
    description?: string;
}): Promise<TimelineEventOut> {
    return request<TimelineEventOut>("/timeline/event", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

// ===== CCTV =====

export async function analyzeCCTV(caseId: string, file: File): Promise<{ video_id: string; status: string }> {
    const form = new FormData();
    form.append("file", file);
    return request(`/cctv/analyze/${caseId}`, { method: "POST", body: form });
}

export async function getCCTVEvents(caseId: string): Promise<{
    events: unknown[];
    flags: unknown[];
    face_matches: unknown[];
    summary: Record<string, unknown>;
    status: string;
}> {
    return request(`/cctv/events/${caseId}`);
}

export async function getCCTVAIAnalysis(caseId: string): Promise<{ analysis: string }> {
    return request(`/cctv/ai-analysis/${caseId}`);
}

// ===== VOICE =====

export async function transcribeAudio(caseId: string, file: File): Promise<{
    audio_id: string;
    transcript: { full_transcript: string; segments: unknown[] };
    entities: unknown;
    ai_summary: string;
}> {
    const form = new FormData();
    form.append("file", file);
    return request(`/voice/transcribe/${caseId}`, { method: "POST", body: form });
}

// ===== AGENTS =====

export async function runEvidenceAgent(caseId: string): Promise<{ analysis: string }> {
    return request(`/agents/evidence/${caseId}`, { method: "POST" });
}

export async function runTimelineAgent(caseId: string): Promise<{ analysis: string }> {
    return request(`/agents/timeline/${caseId}`, { method: "POST" });
}

export async function runLegalReportAgent(caseId: string): Promise<{ report: string }> {
    return request(`/agents/legal-report/${caseId}`, { method: "POST" });
}

export async function runGraphAgent(caseId: string): Promise<{ analysis: string }> {
    return request(`/agents/graph/${caseId}`, { method: "POST" });
}

export async function getRiskScore(caseId: string): Promise<{ score: number; risk_level: string; flags: string[]; recommendation: string }> {
    return request(`/agents/risk/${caseId}`);
}

export async function runAutopsyAgent(caseId: string): Promise<{ analysis: string }> {
    return request(`/agents/autopsy/${caseId}`, { method: "POST" });
}

export interface ToDParams {
    body_temp_celsius: number;
    ambient_temp_celsius: number;
    body_weight_kg: number;
    rigor_mortis: string;
    livor_mortis: string;
    clothing: string;
    scene_discovery_time: string;
    additional_observations: string;
}

export async function runToDAgent(caseId: string, params: ToDParams): Promise<{ analysis: string; input_params: ToDParams }> {
    return request(`/agents/tod/${caseId}`, {
        method: "POST",
        body: JSON.stringify(params),
    });
}

export async function runFaceSketchAgent(caseId: string): Promise<{ analysis: string }> {
    return request(`/agents/face-sketch/${caseId}`, { method: "POST" });
}

// ===== REPORTS =====

export interface ReportOut {
    id: string;
    case_id: string;
    title: string;
    report_type: string;
    content: string;
    pages: number;
    status: string;
    created_at: string;
}

export async function listReports(caseId?: string): Promise<ReportOut[]> {
    const params = caseId ? `?case_id=${caseId}` : "";
    return request<ReportOut[]>(`/reports${params}`);
}

export async function getReport(id: string): Promise<ReportOut> {
    return request<ReportOut>(`/reports/${id}`);
}

export async function generateReport(caseId: string, reportType = "legal", title = ""): Promise<ReportOut> {
    return request<ReportOut>("/reports", {
        method: "POST",
        body: JSON.stringify({ case_id: caseId, report_type: reportType, title }),
    });
}

export async function deleteReport(id: string): Promise<void> {
    return request(`/reports/${id}`, { method: "DELETE" });
}

// ===== AUDIT =====

export async function getAuditLogs(limit = 50): Promise<unknown[]> {
    return request(`/auth/audit-logs?limit=${limit}`);
}

// ===== MFA =====

export async function setupMFA(): Promise<{ secret: string; qr_code: string }> {
    return request("/auth/mfa/setup", { method: "POST" });
}

export async function verifyMFA(code: string): Promise<{ message: string }> {
    return request("/auth/mfa/verify", {
        method: "POST",
        body: JSON.stringify({ code }),
    });
}

export async function disableMFA(code: string): Promise<{ message: string }> {
    return request("/auth/mfa/disable", {
        method: "POST",
        body: JSON.stringify({ code }),
    });
}

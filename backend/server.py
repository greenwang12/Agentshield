import json
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent import generate_answer
from actions import intercept_action
from config import GEMINI_API_KEY
from guardrail import check_response
from moss_service import load_indexes, moss, retrieve_evidence


BASE_DIR = Path(__file__).resolve().parent
TRACE_FILE = BASE_DIR / "traces.jsonl"
STATE_FILE = BASE_DIR / "app_state.json"


app = FastAPI(
    title="AgentShield API",
    version="1.0.0",
    description="AI reliability and security layer for autonomous agents.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# IN-MEMORY PENDING ACTIONS
# ============================================================

pending_actions: dict[str, dict[str, Any]] = {}


# ============================================================
# ACTION METADATA
# ============================================================

ACTION_META = {
    "SEND_EMAIL": {
        "title": "Send email",
        "irreversible": False,
        "externalCommunication": True,
        "financial": False,
    },
    "SHARE_PRIVATE_DATA": {
        "title": "Share private data",
        "irreversible": False,
        "externalCommunication": False,
        "financial": False,
    },
    "BOOK_SERVICE": {
        "title": "Book service",
        "irreversible": False,
        "externalCommunication": False,
        "financial": False,
    },
    "ISSUE_REFUND": {
        "title": "Issue refund",
        "irreversible": False,
        "externalCommunication": False,
        "financial": True,
    },
    "CHANGE_ACCOUNT_SETTINGS": {
        "title": "Change account settings",
        "irreversible": False,
        "externalCommunication": False,
        "financial": False,
    },
    "DELETE_ACCOUNT": {
        "title": "Delete account",
        "irreversible": True,
        "externalCommunication": False,
        "financial": False,
    },
}


# ============================================================
# HELPERS
# ============================================================

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def read_traces() -> list[dict]:
    if not TRACE_FILE.exists():
        return []

    traces = []

    with open(TRACE_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()

            if not line:
                continue

            try:
                traces.append(json.loads(line))
            except json.JSONDecodeError:
                continue

    return traces


def latest_trace() -> dict | None:
    traces = read_traces()

    if not traces:
        return None

    return traces[-1]


def safe_latency(latency: dict | None) -> dict:
    latency = latency or {}

    return {
        "evidence_retrieval_ms": float(
            latency.get("evidence_retrieval_ms", 0)
        ),
        "policy_retrieval_ms": float(
            latency.get("policy_retrieval_ms", 0)
        ),
        "parallel_retrieval_ms": float(
            latency.get(
                "parallel_retrieval_ms",
                latency.get("policy_retrieval_ms", 0),
            )
        ),
        "evaluation_ms": float(
            latency.get("evaluation_ms", 0)
        ),
        "total_guardrail_ms": float(
            latency.get("total_guardrail_ms", 0)
        ),
        "agent_ms": (
            float(latency["agent_ms"])
            if "agent_ms" in latency
            else None
        ),
        "tool_execution_ms": (
            float(latency["tool_execution_ms"])
            if "tool_execution_ms" in latency
            else None
        ),
    }


def create_action(
    action_name: str,
    description: str,
    params: dict,
) -> dict:

    meta = ACTION_META.get(
        action_name,
        {
            "title": action_name,
            "irreversible": False,
            "externalCommunication": False,
            "financial": False,
        },
    )

    return {
        "id": f"act_{uuid4().hex[:10]}",
        "type": action_name,
        "title": meta["title"],
        "description": description,
        "parameters": params,
        "irreversible": meta["irreversible"],
        "externalCommunication": meta["externalCommunication"],
        "financial": meta["financial"],
    }


def map_evidence_doc(doc) -> dict:
    document_id = str(doc.id)
    text = str(doc.text)

    lowered = f"{document_id} {text}".lower()

    if any(
        word in lowered
        for word in [
            "privacy",
            "phone",
            "private",
            "confidential",
            "personal",
        ]
    ):
        category = "Privacy"

    elif any(
        word in lowered
        for word in [
            "refund",
            "payment",
            "billing",
            "invoice",
            "financial",
        ]
    ):
        category = "Billing"

    elif any(
        word in lowered
        for word in [
            "password",
            "authentication",
            "security",
            "token",
            "account",
        ]
    ):
        category = "Security"

    elif any(
        word in lowered
        for word in [
            "email",
            "communication",
            "message",
        ]
    ):
        category = "Communication"

    elif "account" in lowered:
        category = "Account"

    else:
        category = "Product"

    return {
        "id": f"ev_{document_id}",
        "documentId": document_id,
        "category": category,
        "content": text,
        "relevance": 100,
        "retrievalTimeMs": 0,
        "source": "Moss verified knowledge base",
        "lastVerified": now_iso(),
    }


def policy_category(policy_id: str) -> str:
    return {
        "policy_1": "Reliability",
        "policy_2": "Reliability",
        "policy_3": "Actions",
        "policy_4": "Relevance",
        "policy_5": "Privacy",
        "policy_6": "Actions",
        "policy_7": "Privacy",
        "policy_8": "Finance",
        "policy_9": "Communication",
        "policy_10": "Actions",
    }.get(policy_id, "Reliability")


def policy_severity(policy_id: str) -> str:
    return {
        "policy_1": "High",
        "policy_2": "High",
        "policy_3": "Critical",
        "policy_4": "Medium",
        "policy_5": "Critical",
        "policy_6": "Critical",
        "policy_7": "Critical",
        "policy_8": "High",
        "policy_9": "High",
        "policy_10": "Low",
    }.get(policy_id, "Medium")


def policy_trigger_count(
    policy_id: str,
    traces: list[dict],
) -> int:

    return sum(
        1
        for trace in traces
        if policy_id in trace.get("violations", [])
    )


def map_policy_doc(
    doc,
    traces: list[dict],
) -> dict:

    policy_id = str(doc.id)

    return {
        "id": policy_id,
        "category": policy_category(policy_id),
        "description": str(doc.text),
        "status": "Active",
        "severity": policy_severity(policy_id),
        "triggeredCount": policy_trigger_count(
            policy_id,
            traces,
        ),
        "lastTriggered": None,
    }


def action_from_trace(
    trace: dict,
) -> dict | None:

    action_name = trace.get("action")

    if not action_name:
        return None

    if isinstance(action_name, dict):
        action_name = action_name.get("type")

    if not action_name:
        return None

    return create_action(
        action_name=action_name,
        description=trace.get("agent_output", ""),
        params=trace.get("action_params", {}) or {},
    )


def trace_to_frontend(
    trace: dict,
) -> dict:

    action = action_from_trace(trace)

    return {
        "id": trace.get(
            "id",
            f"trace_{uuid4().hex[:8]}",
        ),
        "timestamp": trace.get(
            "timestamp",
            now_iso(),
        ),
        "trace_type": trace.get(
            "trace_type",
            "response",
        ),
        "user_input": trace.get(
            "user_input",
            "",
        ),
        "agent_output": trace.get(
            "agent_output",
            "",
        ),
        "intent": trace.get(
            "intent",
            "",
        ),
        "verdict": trace.get(
            "verdict",
            "BLOCK",
        ),
        "risk": trace.get(
            "risk",
            100,
        ),
        "violations": trace.get(
            "violations",
            [],
        ),
        "decision": trace.get(
            "decision",
            "BLOCK",
        ),
        "reason": trace.get(
            "reason",
            "",
        ),
        "evidence": trace.get(
            "evidence",
            [],
        ),
        "policies": trace.get(
            "policies",
            [],
        ),
        "action": action,
        "action_params": trace.get(
            "action_params"
        ),
        "executed": bool(
            trace.get(
                "executed",
                False,
            )
        ),
        "latency": safe_latency(
            trace.get("latency")
        ),
    }


def trace_action_name(
    trace: dict,
) -> str | None:

    action = trace.get("action")

    if isinstance(action, str):
        return action

    if isinstance(action, dict):
        return action.get("type")

    return None


def stats(
    values: list[float],
) -> dict[str, float]:

    if not values:
        return {
            "mean": 0,
            "median": 0,
            "p95": 0,
            "current": 0,
        }

    ordered = sorted(values)

    midpoint = len(ordered) // 2

    if len(ordered) % 2:
        median = ordered[midpoint]
    else:
        median = (
            ordered[midpoint - 1]
            + ordered[midpoint]
        ) / 2

    p95_index = min(
        len(ordered) - 1,
        int(
            round(
                0.95 * (len(ordered) - 1)
            )
        ),
    )

    return {
        "mean": round(
            sum(values) / len(values),
            2,
        ),
        "median": round(
            median,
            2,
        ),
        "p95": round(
            ordered[p95_index],
            2,
        ),
        "current": round(
            values[-1],
            2,
        ),
    }


# ============================================================
# STARTUP
# ============================================================

@app.on_event("startup")
async def startup():
    await load_indexes()


# ============================================================
# ROOT
# ============================================================

@app.get("/")
async def root():
    return {
        "name": "AgentShield API",
        "status": "operational",
        "version": "1.0.0",
    }


# ============================================================
# CHAT
# ============================================================

class MessageRequest(BaseModel):
    message: str


@app.post("/agent/messages")
async def send_message(
    body: MessageRequest,
):

    started = time.perf_counter()

    result = await generate_answer(
        body.message
    )

    agent_ms = (
        time.perf_counter() - started
    ) * 1000

    response_id = (
        f"response_{uuid4().hex[:10]}"
    )

    # --------------------------------------------------------
    # ACTION
    # --------------------------------------------------------

    if result["type"] == "action":

        action_name = result["action"]
        description = result["description"]
        params = result.get("params", {})

        action = create_action(
            action_name=action_name,
            description=description,
            params=params,
        )

        # Keep the exact same action ID.
        pending_actions[action["id"]] = {
            "action": action,
            "action_name": action_name,
            "description": description,
            "params": params,
            "created_at": now_iso(),
        }

        guard = await intercept_action(
            action_name=action_name,
            description=description,
            params=params,
        )

        if guard["decision"] != "REVIEW": pending_actions.pop(action["id"], None)

        latency = safe_latency(
            guard.get("latency")
        )

        latency["agent_ms"] = round(
            agent_ms,
            2,
        )

        return {
            "id": response_id,
            "userInput": body.message,
            "agentOutput": description,
            "intent": "ACTION",
            "traceType": "action",
            "action": action,
            "timestamp": now_iso(),
            "guardrail": {
                "verdict": guard["verdict"],
                "risk": guard["risk"],
                "violations": guard["violations"],
                "decision": guard["decision"],
                "reason": guard["reason"],
                "evidence": [],
                "policies": [],
                "executed": guard["executed"],
                "latency": latency,
            },
        }

    # --------------------------------------------------------
    # NORMAL RESPONSE
    # --------------------------------------------------------

    answer = result["answer"]

    guard = await check_response(
        question=body.message,
        answer=answer,
    )

    latency = safe_latency(
        guard.get("latency")
    )

    latency["agent_ms"] = round(
        agent_ms,
        2,
    )

    evidence = [
        map_evidence_doc(doc)
        for doc in guard.get(
            "evidence",
            [],
        )
    ]

    return {
        "id": response_id,
        "userInput": body.message,
        "agentOutput": answer,
        "intent": result.get(
            "intent",
            "KNOWLEDGE",
        ),
        "traceType": "response",
        "timestamp": now_iso(),
        "guardrail": {
            "verdict": guard["verdict"],
            "risk": guard["risk"],
            "violations": guard["violations"],
            "decision": guard["decision"],
            "reason": guard["reason"],
            "evidence": evidence,
            "policies": [],
            "executed": False,
            "latency": latency,
        },
    }


# ============================================================
# ACTIONS
# ============================================================
@app.get("/actions")
async def get_actions():
    results = []
    traces = read_traces()

    historical_action_ids = set()

    for trace in reversed(traces):
        if trace.get("trace_type") != "action":
            continue

        action_name = trace_action_name(trace)

        if not action_name:
            continue

        frontend_trace = trace_to_frontend(trace)
        action = frontend_trace.get("action")

        if action is None:
            continue

        historical_id = frontend_trace["id"]
        action["id"] = f"act_{historical_id}"

        historical_action_ids.add(action["id"])

        results.append(
            {
                "action": action,
                "trace": frontend_trace,
                "status": frontend_trace["decision"],
            }
        )

    for action_id, pending in pending_actions.items():
        if action_id in historical_action_ids:
            continue

        results.append(
            {
                "action": pending["action"],
                "trace": None,
                "status": "REVIEW",
            }
        )

    return results

@app.post(
    "/actions/{action_id}/execute"
)
async def execute_action_endpoint(
    action_id: str,
):

    pending = pending_actions.get(
        action_id
    )

    if pending is None:
        raise HTTPException(
            status_code=404,
            detail="Action not found or expired.",
        )

    result = await intercept_action(
        action_name=pending["action_name"],
        description=pending["description"],
        params=pending["params"],
        confirmed=True,
    )

    executed = bool(
        result.get("executed", False)
    )

    return {
        "executed": executed,
        "message": (
            result.get("execution_result", {})
            .get(
                "message",
                "Action was executed."
                if executed
                else "Action was not executed.",
            )
            if result.get("execution_result")
            else result.get(
                "reason",
                "Action was executed."
                if executed
                else "Action was not executed.",
            )
        ),
    }


@app.post(
    "/actions/{action_id}/confirm"
)
async def confirm_action(
    action_id: str,
):

    pending = pending_actions.get(
        action_id
    )

    if pending is None:
        raise HTTPException(
            status_code=404,
            detail="Action not found or expired.",
        )

    result = await intercept_action(
        action_name=pending["action_name"],
        description=pending["description"],
        params=pending["params"],
        confirmed=True,
    )

    executed = bool(
        result.get("executed", False)
    )

    if executed:
        pending_actions.pop(
            action_id,
            None,
        )

    return {
        "decision": (
            "APPROVE"
            if executed
            else result.get(
                "decision",
                "REVIEW",
            )
        ),
        "executed": executed,
        "steps": [
            "Checking authorization...",
            (
                "Policy confirmed..."
                if executed
                else "Policy check failed..."
            ),
            (
                "Executing action..."
                if executed
                else "Execution stopped..."
            ),
        ],
    }


# ============================================================
# EVIDENCE
# ============================================================

@app.get("/evidence")
async def get_evidence():

    docs = await moss.get_docs("faq")

    return [
        map_evidence_doc(doc)
        for doc in docs
    ]


@app.get("/evidence/search")
async def search_evidence(
    q: str = "",
    category: str = "All",
):

    if not q.strip():
        results = await get_evidence()

    else:
        docs = await retrieve_evidence(
            q,
            top_k=10,
        )

        results = [
            map_evidence_doc(doc)
            for doc in docs
        ]

    if category != "All":
        results = [
            item
            for item in results
            if item["category"] == category
        ]

    return results


# ============================================================
# POLICIES
# ============================================================

@app.get("/policies")
async def get_policies():

    traces = read_traces()

    docs = await moss.get_docs(
        "policies"
    )

    return [
        map_policy_doc(
            doc,
            traces,
        )
        for doc in docs
    ]


@app.get("/policies/{policy_id}")
async def get_policy(
    policy_id: str,
):

    traces = read_traces()

    docs = await moss.get_docs(
        "policies"
    )

    target = None

    for doc in docs:
        if str(doc.id) == policy_id:
            target = doc
            break

    if target is None:
        raise HTTPException(
            status_code=404,
            detail=f"Policy '{policy_id}' not found.",
        )

    policy = map_policy_doc(
        target,
        traces,
    )

    matching_traces = [
        trace_to_frontend(trace)
        for trace in traces
        if policy_id in trace.get(
            "violations",
            [],
        )
    ]

    return {
        "policy": policy,
        "traces": matching_traces,
    }


# ============================================================
# TRACES
# ============================================================

@app.get("/traces")
async def get_traces():

    return [
        trace_to_frontend(trace)
        for trace in read_traces()
    ]


@app.get("/traces/{trace_id}")
async def get_trace(
    trace_id: str,
):

    for trace in read_traces():

        if trace.get("id") == trace_id:

            return trace_to_frontend(
                trace
            )

    raise HTTPException(
        status_code=404,
        detail=f"Trace '{trace_id}' not found.",
    )


# ============================================================
# STATUS
# ============================================================

@app.get("/status")
async def get_status():

    latest = latest_trace()

    current_latency = 0

    if latest:
        current_latency = (
            latest.get("latency", {})
            .get(
                "total_guardrail_ms",
                0,
            )
        )

    return {
        "backend": "connected",
        "moss": "connected",
        "gemini": (
            "connected"
            if GEMINI_API_KEY
            else "offline"
        ),
        "environment": "LOCAL",
        "status": "Operational",
        "currentLatencyMs": round(
            float(current_latency),
            2,
        ),
    }


# ============================================================
# METRICS
# ============================================================
# ============================================================
# METRICS
# ============================================================

@app.get("/metrics")
async def get_metrics():

    traces = read_traces()

    response_values = []
    action_values = []

    response_retrieval_values = []
    action_retrieval_values = []

    response_evaluation_values = []
    action_evaluation_values = []

    decisions = Counter()

    for trace in traces:

        decisions[
            trace.get(
                "decision",
                "BLOCK",
            )
        ] += 1

        latency = trace.get(
            "latency",
            {},
        )

        is_action = (
            trace.get("trace_type") == "action"
        )

        # ----------------------------------------------------
        # TOTAL GUARDRAIL LATENCY
        # ----------------------------------------------------

        total = latency.get(
            "total_guardrail_ms"
        )

        if total is not None:

            total = float(total)

            if is_action:
                action_values.append(total)
            else:
                response_values.append(total)

        # ----------------------------------------------------
        # MOSS RETRIEVAL LATENCY
        # ----------------------------------------------------
        #
        # Response guardrails use parallel_retrieval_ms.
        # Action guardrails use policy_retrieval_ms.
        #

        if is_action:

            retrieval = latency.get(
                "policy_retrieval_ms"
            )

            if retrieval is None:
                retrieval = latency.get(
                    "parallel_retrieval_ms"
                )

            if retrieval is not None:

                retrieval = float(retrieval)

                if retrieval > 0:
                    action_retrieval_values.append(
                        retrieval
                    )

        else:

            retrieval = latency.get(
                "parallel_retrieval_ms"
            )

            if retrieval is not None:

                retrieval = float(retrieval)

                if retrieval > 0:
                    response_retrieval_values.append(
                        retrieval
                    )

        # ----------------------------------------------------
        # GEMINI EVALUATION LATENCY
        # ----------------------------------------------------

        evaluation = latency.get(
            "evaluation_ms"
        )

        if evaluation is not None:

            evaluation = float(evaluation)

            if evaluation > 0:

                if is_action:
                    action_evaluation_values.append(
                        evaluation
                    )
                else:
                    response_evaluation_values.append(
                        evaluation
                    )

    # --------------------------------------------------------
    # COMBINED GUARDRAIL
    # --------------------------------------------------------

    all_guardrail = (
        response_values
        + action_values
    )

    def average(
        values: list[float],
    ):

        if not values:
            return 0

        return round(
            sum(values) / len(values),
            2,
        )

    # --------------------------------------------------------
    # OVERVIEW
    # --------------------------------------------------------

    overview = [
        {
            "label": "Requests Analyzed",
            "value": f"{len(traces):,}",
            "delta": "LIVE",
            "tone": "neutral",
        },
        {
            "label": "Actions Intercepted",
            "value": f"{len(action_values):,}",
            "delta": "LIVE",
            "tone": "neutral",
        },
        {
            "label": "Blocked Requests",
            "value": f"{decisions['BLOCK']:,}",
            "delta": "LIVE",
            "tone": "danger",
        },
        {
            "label": "Review Requests",
            "value": f"{decisions['REVIEW']:,}",
            "delta": "confirmation required",
            "tone": "warn",
        },
        {
            "label": "Average Guardrail Latency",
            "value": f"{average(all_guardrail):.0f} ms",
            "delta": "LOCAL",
            "tone": "good",
        },
        {
            "label": "Average Moss Retrieval",
            "value": (
                f"{average(response_retrieval_values + action_retrieval_values):.2f} ms"
            ),
            "delta": "LOCAL",
            "tone": "good",
        },
    ]

    # --------------------------------------------------------
    # PERFORMANCE STATISTICS
    # --------------------------------------------------------

    response_stats = stats(
        response_values
    )

    action_stats = stats(
        action_values
    )

    response_retrieval_stats = stats(
        response_retrieval_values
    )

    action_retrieval_stats = stats(
        action_retrieval_values
    )

    response_evaluation_stats = stats(
        response_evaluation_values
    )

    action_evaluation_stats = stats(
        action_evaluation_values
    )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "overview": overview,
        "performance": {
            "responseGuardrail": response_stats,
            "mossResponseRetrieval": response_retrieval_stats,
            "geminiResponseEvaluation": response_evaluation_stats,
            "actionGuardrail": action_stats,
            "mossActionPolicyRetrieval": action_retrieval_stats,
            "geminiActionEvaluation": action_evaluation_stats,
            "points": [],
        },
    }

# ============================================================
# STATE
# ============================================================

@app.get("/state")
async def get_state():

    if not STATE_FILE.exists():
        return {}

    try:
        with open(
            STATE_FILE,
            "r",
            encoding="utf-8",
        ) as f:
            return json.load(f)

    except json.JSONDecodeError:
        return {}


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
async def health():

    return {
        "status": "ok",
    }
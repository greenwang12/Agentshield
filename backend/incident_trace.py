import json
from datetime import datetime, timezone
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
TRACE_FILE = BASE_DIR / "traces.jsonl"


def create_trace(
    *,
    trace_type: str,
    user_input: str,
    agent_output: str | None,
    verdict: str,
    risk: int,
    violations: str,
    decision: str,
    reason: str,
    evidence=None,
    policies=None,
    action: str | None = None,
    action_params: dict | None = None,
    executed: bool | None = None,
    latency: dict | None = None,
):
    """Create and persist an AgentShield trace."""

    trace = {
        "timestamp": datetime.now(timezone.utc).isoformat(),

        "trace_type": trace_type,

        "user_input": user_input,
        "agent_output": agent_output,

        "verdict": verdict,
        "risk": risk,
        "violations": violations,
        "decision": decision,
        "reason": reason,

        "evidence": [
            {
                "id": doc.id,
                "text": doc.text,
            }
            for doc in (evidence or [])
        ],

        "policies": [
            {
                "id": doc.id,
                "text": doc.text,
            }
            for doc in (policies or [])
        ],

        "action": action,
        "action_params": action_params,
        "executed": executed,

        "latency": latency or {},
    }

    with TRACE_FILE.open(
        "a",
        encoding="utf-8"
    ) as file:

        file.write(
            json.dumps(
                trace,
                ensure_ascii=False
            ) + "\n"
        )

    print(
        f"\n[Trace saved] {TRACE_FILE}"
    )

    return trace
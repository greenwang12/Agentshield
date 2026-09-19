from guardrail import check_action
from incident_trace import create_trace
from tool_executor import execute_action


AVAILABLE_ACTIONS = {
    "SEND_EMAIL",
    "SHARE_PRIVATE_DATA",
    "BOOK_SERVICE",
    "ISSUE_REFUND",
    "CHANGE_ACCOUNT_SETTINGS",
    "DELETE_ACCOUNT",
}


CONFIRMATION_POLICIES = {
    "policy_6",
    "policy_8",
    "policy_9",
}


async def intercept_action(
    action_name: str,
    description: str,
    params: dict,
    confirmed: bool = False,
):
    """
    Validate an action and execute it only when
    AgentShield allows it.
    """

    if action_name not in AVAILABLE_ACTIONS:

        result = {
            "verdict": "BLOCK",
            "risk": 100,
            "violations": ["UNKNOWN_ACTION"],
            "decision": "BLOCK",
            "reason": (
                "The requested action is not supported."
            ),
            "executed": False,
            "execution_result": None,
            "latency": {},
        }

        create_trace(
            trace_type="action",
            user_input=description,
            agent_output="",
            verdict=result["verdict"],
            risk=result["risk"],
            violations=result["violations"],
            decision=result["decision"],
            reason=result["reason"],
            evidence=[],
            policies=[],
            action=action_name,
            action_params=params,
            executed=False,
            latency={},
        )

        return result

    # ========================================================
    # AGENTSHIELD CHECK
    # ========================================================

    result = await check_action(
        action_name=action_name,
        description=description,
        params=params,
    )

    executed = False
    execution_result = None

    # ========================================================
    # BLOCK
    # ========================================================

    if result["decision"] == "BLOCK":

        executed = False

    # ========================================================
    # APPROVE
    # ========================================================

    elif result["decision"] == "APPROVE":

        execution_result = execute_action(
            action_name=action_name,
            params=params,
        )

        executed = execution_result["success"]

    # ========================================================
    # REVIEW + USER CONFIRMATION
    # ========================================================

    elif (
        result["decision"] == "REVIEW"
        and confirmed
    ):

        violations = set(
            result.get("violations", [])
        )

        if violations.issubset(
            CONFIRMATION_POLICIES
        ):

            result["verdict"] = "PASS"
            result["risk"] = 0
            result["decision"] = "APPROVE"
            result["reason"] = (
                "The user explicitly confirmed "
                "the action required by the "
                "applicable confirmation policy."
            )

            execution_result = execute_action(
                action_name=action_name,
                params=params,
            )

            executed = execution_result["success"]

    # ========================================================
    # TRACE
    # ========================================================

    create_trace(
        trace_type="action",
        user_input=description,
        agent_output="",
        verdict=result["verdict"],
        risk=result["risk"],
        violations=result["violations"],
        decision=result["decision"],
        reason=result["reason"],
        evidence=[],
        policies=result.get("policies", []),
        action=action_name,
        action_params=params,
        executed=executed,
        latency=result.get("latency", {}),
    )

    return {
        **result,
        "executed": executed,
        "execution_result": execution_result,
    }
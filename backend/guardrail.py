from evaluator import (
    evaluate_agent,
    evaluate_action,
)


async def check_response(
    question: str,
    answer: str
) -> dict:
    """Check a normal AI response."""

    result = await evaluate_agent(
        question,
        answer
    )

    if result["verdict"] == "PASS":
        decision = "APPROVE"

    elif result["verdict"] == "FLAG":
        decision = "REVIEW"

    else:
        decision = "BLOCK"

    return {
        **result,
        "decision": decision
    }


async def check_action(
    action_name: str,
    description: str,
    params: dict
) -> dict:
    """Check an AI-agent action."""

    result = await evaluate_action(
        action_name,
        description,
        params
    )

    if result["verdict"] == "PASS":
        decision = "APPROVE"

    elif result["verdict"] == "FLAG":
        decision = "REVIEW"

    else:
        decision = "BLOCK"

    return {
        **result,
        "decision": decision
    }
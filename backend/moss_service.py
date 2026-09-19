from moss import MossClient, QueryOptions
from config import MOSS_PROJECT_ID, MOSS_PROJECT_KEY


moss = MossClient(
    MOSS_PROJECT_ID,
    MOSS_PROJECT_KEY
)


async def load_indexes():
    """Load the existing Moss indexes."""

    await moss.load_index("faq")
    print("FAQ index loaded.")

    await moss.load_index("policies")
    print("Policy index loaded.")


async def retrieve_evidence(
    question: str,
    top_k: int = 3
):
    """Retrieve verified evidence from the FAQ index."""

    results = await moss.query(
        "faq",
        question,
        QueryOptions(top_k=top_k)
    )

    return results.docs


async def retrieve_policies(
    question: str,
    answer: str,
    top_k: int = 3
):
    """Retrieve policies for normal AI responses."""

    query = f"""
Question:
{question}

Agent answer:
{answer}

Evaluate this response for:
factual accuracy,
hallucination,
safety,
privacy,
relevance,
policy violations,
and unsupported claims.
"""

    results = await moss.query(
        "policies",
        query,
        QueryOptions(top_k=top_k)
    )

    return results.docs


async def retrieve_action_policies(
    action_name: str,
    description: str,
    params: dict,
    top_k: int = 5
):
    """Retrieve policies specifically related to an agent action."""

    query = f"""
AI agent action:
{action_name}

Action description:
{description}

Action parameters:
{params}

Retrieve policies specifically relevant to:
- authorization
- confirmation requirements
- privacy
- financial controls
- external communication
- destructive or irreversible actions
- account changes
- safety
- allowed or prohibited actions

Do not retrieve unrelated informational policies unless they
directly apply to this action.
"""

    results = await moss.query(
        "policies",
        query,
        QueryOptions(top_k=top_k)
    )

    return results.docs
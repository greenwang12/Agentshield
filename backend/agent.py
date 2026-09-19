import json
import re
from datetime import datetime

from google import genai

from config import GEMINI_API_KEY, MODEL_NAME
from moss_service import retrieve_evidence
from intent_router import detect_intent


client = genai.Client(
    api_key=GEMINI_API_KEY
)


SUPPORTED_ACTIONS = {
    "SEND_EMAIL",
    "SHARE_PRIVATE_DATA",
    "BOOK_SERVICE",
    "ISSUE_REFUND",
    "CHANGE_ACCOUNT_SETTINGS",
    "DELETE_ACCOUNT",
}


def normalize_date(question: str, params: dict) -> dict:
    """
    Fix dates when the user provides only month/day.

    Example:
        User: "September 25"
        Model: "2025-09-25"

    If the user did not explicitly provide a year,
    use the current year.
    """

    if not isinstance(params, dict):
        return {}

    params = dict(params)

    # Look for explicit month + day in the user's request.
    match = re.search(
        r"\b("
        r"january|february|march|april|may|june|"
        r"july|august|september|october|november|december"
        r")\s+(\d{1,2})\b",
        question,
        re.IGNORECASE,
    )

    if not match:
        return params

    month_name = match.group(1)
    day = int(match.group(2))

    # Check whether the user explicitly gave a year.
    year_match = re.search(
        r"\b(20\d{2})\b",
        question,
    )

    if year_match:
        year = int(year_match.group(1))
    else:
        year = datetime.now().year

    try:
        month = datetime.strptime(
            month_name,
            "%B",
        ).month

        normalized = datetime(
            year,
            month,
            day,
        ).strftime("%Y-%m-%d")

        # If Gemini already returned a date parameter,
        # correct it using the user's actual date.
        if "date" in params:
            params["date"] = normalized

    except ValueError:
        pass

    return params


async def generate_answer(question: str) -> dict:
    """
    Main agent entry point.

    Returns either:
    - a normal response
    - a structured action proposal
    """

    intent = detect_intent(question)

    # ========================================================
    # CASUAL CONVERSATION
    # ========================================================

    if intent == "CASUAL":

        response = await client.aio.models.generate_content(
            model=MODEL_NAME,
            contents=f"""
You are a friendly AI assistant.

Respond naturally to this message:

{question}

Do not claim to have private thoughts or feelings.
Keep the response concise and natural.
"""
        )

        return {
            "type": "response",
            "answer": response.text.strip(),
            "evidence": [],
            "intent": intent,
        }

    # ========================================================
    # ACTION REQUEST
    # ========================================================

    if intent == "ACTION":

        response = await client.aio.models.generate_content(
            model=MODEL_NAME,
            contents=f"""
You are an AI agent that can propose actions.

USER REQUEST:
{question}

Determine whether the user is asking the agent to perform
one of these supported actions:

{", ".join(sorted(SUPPORTED_ACTIONS))}

Return ONLY valid JSON.

For an action request:

{{
  "type": "action",
  "action": "ACTION_NAME",
  "description": "clear description of the proposed action",
  "params": {{}}
}}

For example:

{{
  "type": "action",
  "action": "BOOK_SERVICE",
  "description": "Book a service appointment for the user",
  "params": {{
    "date": "2026-09-25"
  }}
}}

IMPORTANT DATE RULE:

If the user provides a date such as:

"September 25"

but does NOT provide a year, do not invent a different year.
Return the month and day accurately.

The application will normalize the year separately.

If the user explicitly provides a year, preserve that year.

Do NOT execute the action.
Only describe the proposed action.

If the request does not correspond to a supported action,
return:

{{
  "type": "response",
  "content": "Explain the request normally."
}}
"""
        )

        text = response.text.strip()

        # Gemini sometimes wraps JSON in ```json ... ```
        if text.startswith("```"):
            text = re.sub(
                r"^```(?:json)?\s*",
                "",
                text,
                flags=re.IGNORECASE,
            )

            text = re.sub(
                r"\s*```$",
                "",
                text,
            )

        try:
            data = json.loads(text)

        except json.JSONDecodeError:

            return {
                "type": "response",
                "answer": text,
                "evidence": [],
                "intent": intent,
            }

        if data.get("type") == "action":

            action_name = str(
                data.get("action", "")
            ).upper()

            if action_name in SUPPORTED_ACTIONS:

                params = data.get(
                    "params",
                    {},
                )

                # ------------------------------------------------
                # Normalize user-provided dates.
                # ------------------------------------------------

                params = normalize_date(
                    question,
                    params,
                )

                return {
                    "type": "action",
                    "action": action_name,
                    "description": data.get(
                        "description",
                        question,
                    ),
                    "params": params,
                    "intent": intent,
                }

        return {
            "type": "response",
            "answer": data.get(
                "content",
                "I could not determine the requested action.",
            ),
            "evidence": [],
            "intent": intent,
        }

    # ========================================================
    # KNOWLEDGE REQUEST
    # ========================================================

    docs = await retrieve_evidence(
        question
    )

    context = "\n".join(
        f"[{doc.id}] {doc.text}"
        for doc in docs
    )

    response = await client.aio.models.generate_content(
        model=MODEL_NAME,
        contents=f"""
You are the main AI agent.

Use ONLY the verified evidence below.

VERIFIED EVIDENCE:
{context}

USER QUESTION:
{question}

Answer clearly using only supported information.

If the evidence is insufficient, say:

"I don't have enough verified information to answer that."
"""
    )

    return {
        "type": "response",
        "answer": response.text.strip(),
        "evidence": docs,
        "intent": intent,
    }
import json
from datetime import datetime, timezone
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
STATE_FILE = BASE_DIR / "app_state.json"


DEFAULT_STATE = {
    "accounts": {
        "demo_user": {
            "active": True,
            "email_notifications": True,
            "email": "demo@example.com",
        }
    },
    "bookings": [],
    "emails": [],
    "refunds": [],
}


def load_state():
    if not STATE_FILE.exists():
        save_state(DEFAULT_STATE.copy())
        return DEFAULT_STATE.copy()

    try:
        with open(STATE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        save_state(DEFAULT_STATE.copy())
        return DEFAULT_STATE.copy()


def save_state(state):
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(
            state,
            f,
            indent=2,
        )


def now():
    return datetime.now(timezone.utc).isoformat()


def execute_action(
    action_name: str,
    params: dict,
) -> dict:
    """
    Execute an approved AgentShield action
    against the local application state.
    """

    state = load_state()

    # ========================================================
    # BOOK SERVICE
    # ========================================================

    if action_name == "BOOK_SERVICE":

        booking = {
            "id": f"booking_{len(state['bookings']) + 1}",
            "date": params.get("date"),
            "status": "confirmed",
            "created_at": now(),
        }

        state["bookings"].append(booking)

        save_state(state)

        return {
            "success": True,
            "action": action_name,
            "result": booking,
            "message": (
                f"Service appointment booked for "
                f"{booking['date']}."
            ),
        }

    # ========================================================
    # CHANGE ACCOUNT SETTINGS
    # ========================================================

    if action_name == "CHANGE_ACCOUNT_SETTINGS":

        setting = params.get("setting")
        value = params.get("value")

        account = state["accounts"].get("demo_user")

        if account is None:
            return {
                "success": False,
                "action": action_name,
                "message": "Demo account not found.",
            }

        if setting != "email_notifications":
            return {
                "success": False,
                "action": action_name,
                "message": "Unsupported account setting.",
            }

        account[setting] = value

        save_state(state)

        return {
            "success": True,
            "action": action_name,
            "result": {
                "setting": setting,
                "value": value,
            },
            "message": (
                f"{setting} updated to {value}."
            ),
        }

    # ========================================================
    # SEND EMAIL
    # ========================================================

    if action_name == "SEND_EMAIL":

        email = {
            "id": f"email_{len(state['emails']) + 1}",
            "recipient": params.get("recipient"),
            "subject": params.get("subject"),
            "body": params.get("body"),
            "status": "sent",
            "created_at": now(),
        }

        state["emails"].append(email)

        save_state(state)

        return {
            "success": True,
            "action": action_name,
            "result": email,
            "message": (
                f"Email sent to "
                f"{email['recipient']}."
            ),
        }

    # ========================================================
    # ISSUE REFUND
    # ========================================================

    if action_name == "ISSUE_REFUND":

        refund = {
            "id": f"refund_{len(state['refunds']) + 1}",
            "amount": params.get("amount"),
            "status": "processed",
            "created_at": now(),
        }

        state["refunds"].append(refund)

        save_state(state)

        return {
            "success": True,
            "action": action_name,
            "result": refund,
            "message": (
                f"Refund of {refund['amount']} "
                f"processed."
            ),
        }

    # ========================================================
    # DELETE ACCOUNT
    # ========================================================

    if action_name == "DELETE_ACCOUNT":

        account = state["accounts"].get("demo_user")

        if account is None:
            return {
                "success": False,
                "action": action_name,
                "message": "Demo account not found.",
            }

        account["active"] = False

        save_state(state)

        return {
            "success": True,
            "action": action_name,
            "result": {
                "account": "demo_user",
                "active": False,
            },
            "message": "Demo account has been deactivated.",
        }

    # ========================================================
    # PRIVATE DATA
    # ========================================================

    if action_name == "SHARE_PRIVATE_DATA":

        return {
            "success": False,
            "action": action_name,
            "message": (
                "Private data sharing is not an executable action."
            ),
        }

    # ========================================================
    # UNKNOWN ACTION
    # ========================================================

    return {
        "success": False,
        "action": action_name,
        "message": "Unsupported action.",
    }
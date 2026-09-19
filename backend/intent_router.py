import re


CASUAL_PATTERNS = [
    r"^\s*(hi|hello|hey)\s*$",
    r"good morning",
    r"good afternoon",
    r"good evening",
    r"how are you",
    r"what are you thinking",
    r"i am sad",
    r"i'm sad",
]


ACTION_PATTERNS = [
    r"\bsend\b",
    r"\bbook\b",
    r"\bcancel\b",
    r"\bdelete\b",
    r"\bchange\b",
    r"\bupdate\b",
    r"\bdisable\b",
    r"\benable\b",
    r"\bsettings?\b",
    r"\bnotification(s)?\b",
    r"\brefund\b",
    r"\btransfer\b",
    r"\bpurchase\b",
    r"\bsubmit\b",
]


PRIVACY_PATTERNS = [
    r"\bprivate\b",
    r"\bconfidential\b",
    r"\bpersonal information\b",
    r"\bphone number\b",
    r"\bpersonal number\b",
    r"\bprivate data\b",
    r"\bprivate information\b",
]


def detect_intent(message: str) -> str:

    text = message.lower().strip()

    for pattern in CASUAL_PATTERNS:
        if re.search(pattern, text):
            return "CASUAL"

    for pattern in PRIVACY_PATTERNS:
        if re.search(pattern, text):
            return "ACTION"

    for pattern in ACTION_PATTERNS:
        if re.search(pattern, text):
            return "ACTION"

    return "KNOWLEDGE"
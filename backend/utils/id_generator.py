from backend.database import db
from datetime import datetime
from zoneinfo import ZoneInfo

IST = ZoneInfo("Asia/Kolkata")

def _now_ist():
    return datetime.now(IST)

def get_next_ticket_id(ticket_type: str) -> str:
    """
    Ticket IDs:
      VM: SR-VM-HHMM-DDMMYY-000001
      Mobile: SR-MD-HHMM-DDMMYY-000001
      Environment: SR-EN-HHMM-DDMMYY-000001

    Counter resets per day per type automatically.
    """
    now = _now_ist()

    hhmm = now.strftime("%H%M")
    ddmmyy = now.strftime("%d%m%y")

    if ticket_type == "vm":
        code = "VM"
    elif ticket_type == "mobile":
        code = "MD"
    elif ticket_type == "environment":
        code = "EN"
    else:
        code = "OT"

    counter_key = f"{ticket_type}_counter_{ddmmyy}"

    result = db["counters"].find_one_and_update(
        {"_id": counter_key},
        {"$inc": {"sequence_value": 1}},
        upsert=True,
        return_document=True
    )

    seq = result["sequence_value"] if result and "sequence_value" in result else 1
    seq_str = str(seq).zfill(6)

    return f"SR-{code}-{hhmm}-{ddmmyy}-{seq_str}"
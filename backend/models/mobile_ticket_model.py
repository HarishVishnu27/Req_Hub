from backend.database import db
from datetime import datetime

mobile_tickets_collection = db["Mobile_Tickets"]

def create_mobile_ticket(ticket_id, user_email_hash, device_name, os_type, os_version, problem_description, attachments):
    ticket = {
        "ticket_id": ticket_id,
        "user_email_hash": user_email_hash,
        "device_name": device_name,
        "os_type": os_type,
        "os_version": os_version,
        "problem_description": problem_description,
        "attachments": attachments,
        "status": "confirmed",
        "resolved_by": None,
        "resolved_at": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    ticket.pop("_id", None)
    result = mobile_tickets_collection.insert_one(ticket)
    ticket["_id"] = str(result.inserted_id)
    return ticket

def get_all_mobile_tickets():
    return list(mobile_tickets_collection.find())

def update_mobile_ticket_status(ticket_id: str, status: str, resolved_by=None, resolved_at=None):
    update = {"status": status, "updated_at": datetime.utcnow()}
    if status == "resolved":
        update["resolved_by"] = resolved_by
        update["resolved_at"] = resolved_at
    return mobile_tickets_collection.update_one({"ticket_id": ticket_id}, {"$set": update})
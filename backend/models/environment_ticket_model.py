from backend.database import db
from datetime import datetime

environment_tickets_collection = db["Environment_Tickets"]

def create_environment_ticket(ticket_id, user_email_hash, url, problem_description, attachments):
    ticket = {
        "ticket_id": ticket_id,
        "user_email_hash": user_email_hash,
        "url": url,
        "problem_description": problem_description,
        "attachments": attachments,
        "status": "confirmed",
        "resolved_by": None,
        "resolved_at": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    ticket.pop("_id", None)
    result = environment_tickets_collection.insert_one(ticket)
    ticket["_id"] = str(result.inserted_id)
    return ticket

def get_all_environment_tickets():
    return list(environment_tickets_collection.find())

def update_environment_ticket_status(ticket_id: str, status: str, resolved_by=None, resolved_at=None):
    update = {"status": status, "updated_at": datetime.utcnow()}
    if status == "resolved":
        update["resolved_by"] = resolved_by
        update["resolved_at"] = resolved_at
    return environment_tickets_collection.update_one({"ticket_id": ticket_id}, {"$set": update})
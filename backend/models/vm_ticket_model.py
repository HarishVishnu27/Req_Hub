from backend.database import db
from datetime import datetime

vm_tickets_collection = db["VM_Tickets"]

def create_vm_ticket(ticket_id, user_email_hash, vm_name, vm_ip, vm_username, os_type, problem_description, attachments):
    ticket = {
        "ticket_id": ticket_id,
        "user_email_hash": user_email_hash,
        "vm_name": vm_name,
        "vm_ip": vm_ip,
        "vm_username": vm_username,
        "os_type": os_type,  # ✅ NEW
        "problem_description": problem_description,
        "attachments": attachments,
        "status": "confirmed",
        "resolved_by": None,
        "resolved_at": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    ticket.pop("_id", None)
    result = vm_tickets_collection.insert_one(ticket)
    ticket["_id"] = str(result.inserted_id)
    return ticket

def get_all_vm_tickets():
    return list(vm_tickets_collection.find())

def update_vm_ticket_status(ticket_id: str, status: str, resolved_by=None, resolved_at=None):
    update = {"status": status, "updated_at": datetime.utcnow()}
    if status == "resolved":
        update["resolved_by"] = resolved_by
        update["resolved_at"] = resolved_at
    return vm_tickets_collection.update_one({"ticket_id": ticket_id}, {"$set": update})
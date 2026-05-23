from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException
from typing import List
import os

from backend.dependencies.auth import get_current_user
from backend.models.user_model import find_user_by_hash, decrypt_user_for_ui
from backend.models.mobile_ticket_model import create_mobile_ticket
from backend.models.vm_ticket_model import create_vm_ticket
from backend.models.environment_ticket_model import create_environment_ticket
from backend.utils.file_handler import save_file
from backend.utils.id_generator import get_next_ticket_id
from backend.utils.email_service import send_email

ticket_router = APIRouter()

BRAND = "Fastest | Request HUB"

def get_admin_email():
    admin_email = os.getenv("ADMIN_EMAIL")
    if not admin_email:
        raise ValueError("ADMIN_EMAIL is not set in backend/.env")
    return admin_email

def build_ticket_subject(ticket_id: str) -> str:
    return f"{BRAND} | {ticket_id}"

def build_ticket_body(ticket_id: str, ticket_type: str, raised_by: str, details_lines: List[str]) -> str:
    def row(label: str, value: str) -> str:
        return f"""
        <tr>
          <td style="border:1px solid #E5E7EB; padding:8px; width:180px; background:#F9FAFB;"><b>{label}</b></td>
          <td style="border:1px solid #E5E7EB; padding:8px;">{value}</td>
        </tr>
        """

    details_rows = []
    for line in details_lines:
        if ":" in line:
            label, value = line.split(":", 1)
            details_rows.append(row(label.strip(), value.strip()))
        else:
            details_rows.append(row("Details", line.strip()))

    return f"""\
<!doctype html>
<html>
  <body style="font-family: Arial, Helvetica, sans-serif; color:#111827; line-height:1.5;">
    <p>Dear Team,</p>
    <p>A ticket has been created in the <b>Fastest</b> System.</p>
    <p><b>Ticket details are as follows:</b></p>
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse; font-size:14px; width:100%; max-width:700px;">
      {row("Ticket ID", ticket_id)}
      {row("Category", ticket_type)}
      {row("Raised By", raised_by)}
      {"".join(details_rows)}
    </table>
    <br/>
    <p style="margin-top:16px;">Regards,<br/>
    <b>{BRAND}</b></p>
  </body>
</html>
"""

def _current_user_ui(user_payload: dict) -> dict:
    email_hash = user_payload.get("sub")
    if not email_hash:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    u = find_user_by_hash(email_hash)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    return decrypt_user_for_ui(u)

@ticket_router.post("/create_mobile_ticket", summary="Create Mobile Device Ticket")
async def create_mobile_ticket_api(
    device_name: str = Form(...),
    os_type: str = Form(...),
    os_version: str = Form(...),
    problem_description: str = Form(...),
    files: List[UploadFile] = File(default=[]),
    user=Depends(get_current_user),
):
    ui = _current_user_ui(user)
    email_hash = ui["email_hash"]

    ticket_id = get_next_ticket_id("mobile")
    ticket_attachments = [save_file(ticket_id, "mobile", f) for f in files]

    ticket = create_mobile_ticket(
        ticket_id,
        email_hash,
        device_name,
        os_type,
        os_version,
        problem_description,
        ticket_attachments
    )

    admin_email = get_admin_email()
    subject = build_ticket_subject(ticket["ticket_id"])
    body = build_ticket_body(
        ticket_id=ticket["ticket_id"],
        ticket_type="Mobile",
        raised_by=f"{ui['first_name']} {ui['last_name']} ({ui['email']})".strip(),
        details_lines=[
            f"Device Name: {device_name}",
            f"OS: {os_type} {os_version}",
            f"Problem Description: {problem_description}",
        ],
    )

    send_email(subject, admin_email, body, cc_email=ui["email"], attachments=ticket_attachments, is_html=True)
    return {"ticket": ticket}

@ticket_router.post("/create_vm_ticket", summary="Create Virtual Machine Ticket")
async def create_vm_ticket_api(
    vm_name: str = Form(...),
    vm_ip: str = Form(...),
    vm_username: str = Form(...),
    os_type: str = Form(...),  # ✅ NEW
    problem_description: str = Form(...),
    files: List[UploadFile] = File(default=[]),
    user=Depends(get_current_user),
):
    ui = _current_user_ui(user)
    email_hash = ui["email_hash"]

    ticket_id = get_next_ticket_id("vm")
    ticket_attachments = [save_file(ticket_id, "vm", f) for f in files]

    ticket = create_vm_ticket(
        ticket_id,
        email_hash,
        vm_name,
        vm_ip,
        vm_username,
        os_type,  # ✅ NEW
        problem_description,
        ticket_attachments
    )

    admin_email = get_admin_email()
    subject = build_ticket_subject(ticket["ticket_id"])
    body = build_ticket_body(
        ticket_id=ticket["ticket_id"],
        ticket_type="Virtual Machine",
        raised_by=f"{ui['first_name']} {ui['last_name']} ({ui['email']})".strip(),
        details_lines=[
            f"VM Name: {vm_name}",
            f"VM IP: {vm_ip}",
            f"VM Username: {vm_username}",
            f"OS Type: {os_type}",  # ✅ NEW
            f"Problem Description: {problem_description}",
        ],
    )

    send_email(subject, admin_email, body, cc_email=ui["email"], attachments=ticket_attachments, is_html=True)
    return {"ticket": ticket}

@ticket_router.post("/create_environment_ticket", summary="Create Environment Ticket")
async def create_environment_ticket_api(
    url: str = Form(...),
    problem_description: str = Form(...),
    files: List[UploadFile] = File(default=[]),
    user=Depends(get_current_user),
):
    ui = _current_user_ui(user)
    email_hash = ui["email_hash"]

    ticket_id = get_next_ticket_id("environment")
    ticket_attachments = [save_file(ticket_id, "environment", f) for f in files]

    ticket = create_environment_ticket(
        ticket_id,
        email_hash,
        url,
        problem_description,
        ticket_attachments
    )

    admin_email = get_admin_email()
    subject = build_ticket_subject(ticket["ticket_id"])
    body = build_ticket_body(
        ticket_id=ticket["ticket_id"],
        ticket_type="Environment",
        raised_by=f"{ui['first_name']} {ui['last_name']} ({ui['email']})".strip(),
        details_lines=[
            f"URL: {url}",
            f"Problem Description: {problem_description}",
        ],
    )

    send_email(subject, admin_email, body, cc_email=ui["email"], attachments=ticket_attachments, is_html=True)
    return {"ticket": ticket}
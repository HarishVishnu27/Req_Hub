from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional

from backend.models.user_model import (
    create_user,
    find_user_by_email,
    verify_otp,
    decrypt_user_for_ui,
    find_user_by_hash,
)
from backend.utils.email_service import send_email
from backend.utils.jwt_service import create_access_token
from backend.dependencies.auth import get_current_user

import random

auth_router = APIRouter()

class LoginRequest(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class OTPVerificationRequest(BaseModel):
    email: EmailStr
    otp: str

OTP_SUBJECT = "Fastest | Request HUB | OTP"
BRAND = "Fastest | Request HUB"

def build_otp_body(name: str, otp: str) -> str:
    return f"""\
<!doctype html>
<html>
  <body style="font-family: Arial, Helvetica, sans-serif; color:#111827; line-height:1.5;">
    <p>Dear {name},</p>
    <p>Please refer to the below OTP:</p>
    <p style="font-size:18px; margin:12px 0;"><b>{otp}</b></p>
    <p>This OTP will expire in <b>3 minutes</b>.<br/>
       If you didn't request this, please ignore this mail.</p>
    <p>Regards,<br/>
    <b>{BRAND}</b></p>
  </body>
</html>
"""

@auth_router.post("/login", summary="Generate OTP or register")
async def login(request: LoginRequest):
    otp = str(random.randint(100000, 999999))

    user = find_user_by_email(request.email)

    if not user:
        # new user
        if not request.first_name or not request.last_name:
            raise HTTPException(status_code=400, detail="First and last name are required for new users.")

        create_user(request.first_name, request.last_name, request.email, otp)
        send_email(OTP_SUBJECT, request.email, build_otp_body(request.first_name, otp), is_html=True)
        return {"message": "OTP sent for new registration", "email": request.email}

    # existing user: keep encrypted PII already stored; only rotate otp/expiry by calling create_user with decrypted names not possible.
    # We can update OTP without changing PII by reusing stored encrypted values, but current model stores PII on create_user().
    # For simplicity: we will decrypt for greeting only; and update OTP by re-calling create_user with decrypted names.
    ui = decrypt_user_for_ui(user)
    create_user(ui["first_name"], ui["last_name"], request.email, otp)

    send_email(OTP_SUBJECT, request.email, build_otp_body(ui["first_name"] or "User", otp), is_html=True)
    return {"message": "OTP sent for existing user", "email": request.email}

@auth_router.post("/verify", summary="Verify OTP and issue JWT")
async def verify(request: OTPVerificationRequest):
    if not verify_otp(request.email, request.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    user = find_user_by_email(request.email)
    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    token = create_access_token({
        "sub": user["email_hash"],          # ✅ no plaintext PII in JWT
        "is_admin": bool(user.get("is_admin")),
    })

    return {"message": "OTP verified successfully", "token": token}

@auth_router.get("/me", summary="Get current user profile (decrypted)")
async def me(current=Depends(get_current_user)):
    email_hash = current.get("sub")
    if not email_hash:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = find_user_by_hash(email_hash)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {"user": decrypt_user_for_ui(user)}
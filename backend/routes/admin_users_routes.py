from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

from backend.dependencies.auth import get_current_user, require_admin
from backend.database import db
from backend.utils.pii_crypto import encrypt_pii, decrypt_pii, hmac_index

admin_users_router = APIRouter()
users_collection = db["Users"]

class CreateUserRequest(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    is_admin: Optional[bool] = False

class UpdateUserRequest(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UpdateRoleRequest(BaseModel):
    is_admin: bool

def _ui_user(doc: dict) -> dict:
    return {
        "email_hash": doc.get("email_hash"),
        "email": decrypt_pii(doc.get("email_enc", "")) or "",
        "first_name": decrypt_pii(doc.get("first_name_enc", "")) or "",
        "last_name": decrypt_pii(doc.get("last_name_enc", "")) or "",
        "is_admin": bool(doc.get("is_admin")),
        "created_at": doc.get("created_at"),
        "updated_at": doc.get("updated_at"),
    }

@admin_users_router.get("/users", summary="Admin: list users (decrypted)")
def list_users(user=Depends(get_current_user)):
    require_admin(user)
    docs = list(users_collection.find().sort("created_at", -1))
    return {"users": [_ui_user(d) for d in docs]}

@admin_users_router.post("/users", summary="Admin: create user (encrypted)")
def create_user(req: CreateUserRequest, user=Depends(get_current_user)):
    require_admin(user)

    email_norm = req.email.strip().lower()
    email_hash = hmac_index(email_norm)

    existing = users_collection.find_one({"email_hash": email_hash})
    if existing:
        raise HTTPException(status_code=409, detail="User already exists.")

    doc = {
        "email_hash": email_hash,
        "email_enc": encrypt_pii(email_norm),
        "first_name_enc": encrypt_pii(req.first_name.strip()),
        "last_name_enc": encrypt_pii(req.last_name.strip()),
        "is_admin": bool(req.is_admin),
        "otp": None,
        "otp_expiry": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    users_collection.insert_one(doc)
    return {"message": "User created", "user": _ui_user(doc)}

@admin_users_router.patch("/users/{email_hash}", summary="Admin: update user (encrypted)")
def update_user(email_hash: str, req: UpdateUserRequest, user=Depends(get_current_user)):
    require_admin(user)

    existing = users_collection.find_one({"email_hash": email_hash})
    if not existing:
        raise HTTPException(status_code=404, detail="User not found.")

    update = {"updated_at": datetime.utcnow()}

    if req.email is not None:
        new_email_norm = req.email.strip().lower()
        new_hash = hmac_index(new_email_norm)

        if new_hash != email_hash and users_collection.find_one({"email_hash": new_hash}):
            raise HTTPException(status_code=409, detail="Another user already has this email.")

        update["email_hash"] = new_hash
        update["email_enc"] = encrypt_pii(new_email_norm)

    if req.first_name is not None:
        update["first_name_enc"] = encrypt_pii(req.first_name.strip())
    if req.last_name is not None:
        update["last_name_enc"] = encrypt_pii(req.last_name.strip())

    users_collection.update_one({"email_hash": email_hash}, {"$set": update})

    final_hash = update.get("email_hash") or email_hash
    final_doc = users_collection.find_one({"email_hash": final_hash})
    return {"message": "User updated", "user": _ui_user(final_doc)}

@admin_users_router.patch("/users/{email_hash}/role", summary="Admin: update admin role")
def update_role(email_hash: str, req: UpdateRoleRequest, user=Depends(get_current_user)):
    require_admin(user)

    existing = users_collection.find_one({"email_hash": email_hash})
    if not existing:
        raise HTTPException(status_code=404, detail="User not found.")

    users_collection.update_one(
        {"email_hash": email_hash},
        {"$set": {"is_admin": bool(req.is_admin), "updated_at": datetime.utcnow()}}
    )
    final_doc = users_collection.find_one({"email_hash": email_hash})
    return {"message": "Role updated", "user": _ui_user(final_doc)}

@admin_users_router.delete("/users/{email_hash}", summary="Admin: delete user")
def delete_user(email_hash: str, user=Depends(get_current_user)):
    require_admin(user)

    existing = users_collection.find_one({"email_hash": email_hash})
    if not existing:
        raise HTTPException(status_code=404, detail="User not found.")

    # Do not allow deleting yourself
    if user.get("sub") == email_hash:
        raise HTTPException(status_code=400, detail="You cannot delete your own account.")

    # ✅ Only allow deleting NON-admin users
    if bool(existing.get("is_admin")):
        raise HTTPException(status_code=400, detail="Cannot delete an admin user. Remove admin access first.")

    users_collection.delete_one({"email_hash": email_hash})
    return {"message": "User deleted"}
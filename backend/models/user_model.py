from backend.database import db
from datetime import datetime, timedelta
from backend.utils.pii_crypto import encrypt_pii, decrypt_pii, hmac_index

users_collection = db["Users"]

OTP_EXPIRY_MINUTES = 3

def create_user(first_name: str, last_name: str, email: str, otp: str):
    """
    Create/update a user with encrypted PII.
    - No plaintext email/first/last stored.
    - Lookup is done via email_hash (HMAC).
    - Preserve is_admin if already set.
    """
    email_norm = (email or "").strip().lower()
    email_hash = hmac_index(email_norm)

    existing = users_collection.find_one({"email_hash": email_hash})
    is_admin = bool(existing.get("is_admin")) if existing else False

    doc = {
        "email_hash": email_hash,
        "email_enc": encrypt_pii(email_norm),
        "first_name_enc": encrypt_pii(first_name or ""),
        "last_name_enc": encrypt_pii(last_name or ""),
        "is_admin": is_admin,
        "otp": otp,
        "otp_expiry": datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES),
        "updated_at": datetime.utcnow(),
    }

    if not existing:
        doc["created_at"] = datetime.utcnow()

    users_collection.update_one(
        {"email_hash": email_hash},
        {"$set": doc},
        upsert=True
    )
    return doc

def find_user_by_email(email: str):
    email_norm = (email or "").strip().lower()
    email_hash = hmac_index(email_norm)
    return users_collection.find_one({"email_hash": email_hash})

def find_user_by_hash(email_hash: str):
    return users_collection.find_one({"email_hash": email_hash})

def verify_otp(email: str, otp: str) -> bool:
    user = find_user_by_email(email)
    if user and user.get("otp") == otp and user.get("otp_expiry") and user["otp_expiry"] > datetime.utcnow():
        return True
    return False

def decrypt_user_for_ui(user_doc: dict) -> dict:
    """
    Convert DB user document to UI-safe, decrypted structure.
    """
    if not user_doc:
        return None

    email = decrypt_pii(user_doc.get("email_enc", "")) or ""
    first_name = decrypt_pii(user_doc.get("first_name_enc", "")) or ""
    last_name = decrypt_pii(user_doc.get("last_name_enc", "")) or ""

    return {
        "email": email,
        "first_name": first_name,
        "last_name": last_name,
        "email_hash": user_doc.get("email_hash"),
        "is_admin": bool(user_doc.get("is_admin")),
        "created_at": user_doc.get("created_at"),
        "updated_at": user_doc.get("updated_at"),
    }
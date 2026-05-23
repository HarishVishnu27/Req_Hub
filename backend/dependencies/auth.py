from fastapi import Header, HTTPException
from backend.utils.jwt_service import decode_access_token

def get_current_user(authorization: str = Header(default="")) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization Bearer token.")

    token = authorization.replace("Bearer ", "", 1).strip()
    try:
        payload = decode_access_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

    if not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Invalid token payload.")
    return payload

def require_admin(user: dict) -> None:
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required.")
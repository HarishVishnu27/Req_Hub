import os
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError

def _secret() -> str:
    s = os.getenv("JWT_SECRET")
    if not s:
        raise ValueError("JWT_SECRET is not set in backend/.env")
    return s

def _alg() -> str:
    return os.getenv("JWT_ALGORITHM", "HS256")

def _expire_minutes() -> int:
    return int(os.getenv("JWT_EXPIRE_MINUTES", "720"))

def create_access_token(payload: dict) -> str:
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=_expire_minutes())
    data = dict(payload)
    data.update({"iat": int(now.timestamp()), "exp": int(exp.timestamp())})
    return jwt.encode(data, _secret(), algorithm=_alg())

def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, _secret(), algorithms=[_alg()])
    except JWTError as e:
        raise ValueError("Invalid or expired token") from e
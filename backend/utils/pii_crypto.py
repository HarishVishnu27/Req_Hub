import os
import hmac
import hashlib
from base64 import b64decode
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

_PII_SECRET_BASE64 = os.getenv("PII_SECRET_BASE64")

def _get_key() -> bytes:
    if not _PII_SECRET_BASE64:
        raise ValueError("PII_SECRET_BASE64 is not set in backend/.env")
    key = b64decode(_PII_SECRET_BASE64)
    if len(key) != 32:
        raise ValueError("PII_SECRET_BASE64 must decode to exactly 32 bytes for aes-256-gcm")
    return key

def hmac_index(value: str) -> str:
    """
    Deterministic index for lookup (non-reversible).
    Uses HMAC-SHA256 with the same secret key.
    """
    key = _get_key()
    msg = (value or "").strip().lower().encode("utf-8")
    return hmac.new(key, msg, hashlib.sha256).hexdigest()

def encrypt_pii(plain: str) -> str:
    """
    AES-256-GCM encryption.
    Output format: iv_hex:tag_hex:cipher_hex (compatible style with your Node version)
    """
    key = _get_key()
    aesgcm = AESGCM(key)

    iv = os.urandom(12)  # 96-bit nonce recommended for GCM
    data = (plain or "").encode("utf-8")

    ct = aesgcm.encrypt(iv, data, None)  # returns ciphertext + tag at end
    # cryptography gives tag appended to ciphertext (last 16 bytes)
    cipher = ct[:-16]
    tag = ct[-16:]

    return f"{iv.hex()}:{tag.hex()}:{cipher.hex()}"

def decrypt_pii(enc: str) -> str | None:
    key = _get_key()
    aesgcm = AESGCM(key)

    try:
        iv_hex, tag_hex, cipher_hex = (enc or "").split(":")
        iv = bytes.fromhex(iv_hex)
        tag = bytes.fromhex(tag_hex)
        cipher = bytes.fromhex(cipher_hex)

        ct = cipher + tag
        pt = aesgcm.decrypt(iv, ct, None)
        return pt.decode("utf-8")
    except Exception as e:
        print("decrypt_pii failed:", e)
        return None
import hashlib
import hmac
from typing import Optional


def hash_message(message: str) -> str:
    return hashlib.sha256(message.encode()).hexdigest()


def verify_signature(message: str, signature: str, secret: Optional[str] = None) -> bool:
    if secret:
        expected = hmac.new(secret.encode(), message.encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature)
    return True


def create_signature(message: str, secret: str) -> str:
    return hmac.new(secret.encode(), message.encode(), hashlib.sha256).hexdigest()

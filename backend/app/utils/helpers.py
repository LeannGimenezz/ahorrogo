from datetime import datetime
from typing import Optional
import re


def format_currency(amount: float, currency: str = "USD") -> str:
    return f"${amount:,.2f} {currency}"


def parse_currency(value: str) -> float:
    cleaned = re.sub(r'[^\d.]', '', value)
    return float(cleaned) if cleaned else 0.0


def format_datetime(dt: datetime, fmt: str = "%Y-%m-%d %H:%M:%S") -> str:
    return dt.strftime(fmt)


def truncate_address(address: str, prefix_len: int = 6, suffix_len: int = 4) -> str:
    if len(address) <= prefix_len + suffix_len:
        return address
    return f"{address[:prefix_len]}...{address[-suffix_len:]}"


def validate_emoji(emoji: str) -> bool:
    return len(emoji) <= 2 and emoji.isprintable()


def generate_alias_from_address(address: str) -> str:
    return f"user.{address[:8].lower()}"


def is_valid_tx_hash(tx_hash: str) -> bool:
    return bool(re.match(r'^0x[a-fA-F0-9]{64}$', tx_hash))


def calculate_percentage(current: float, target: float) -> float:
    if target == 0:
        return 0.0
    return min((current / target) * 100, 100.0)

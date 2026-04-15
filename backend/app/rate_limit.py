"""
Simple in-memory rate limiter.

- 50 requests per IP per 24 hours for regular users.
- Requests with a valid X-Admin-Token header are unlimited.
"""
import os
import time
from collections import defaultdict
from threading import Lock

from fastapi import Header, HTTPException, Request

DAILY_LIMIT = 50
WINDOW_SECONDS = 24 * 60 * 60  # 24 hours

_lock = Lock()
_requests: dict[str, list[float]] = defaultdict(list)


def _get_ip(request: Request) -> str:
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def check_rate_limit(
    request: Request,
    x_admin_token: str | None = Header(default=None),
) -> None:
    """FastAPI dependency — raises 429 when the daily limit is reached."""
    admin_token = os.environ.get("ADMIN_TOKEN", "").strip()
    if admin_token and x_admin_token == admin_token:
        return  # unlimited for admin

    ip = _get_ip(request)
    now = time.time()
    cutoff = now - WINDOW_SECONDS

    with _lock:
        # Remove timestamps older than 24 hours
        _requests[ip] = [t for t in _requests[ip] if t > cutoff]
        count = len(_requests[ip])
        if count >= DAILY_LIMIT:
            raise HTTPException(
                status_code=429,
                detail=(
                    f"Daily limit of {DAILY_LIMIT} requests reached. "
                    "You have about 15 full conversations per day. "
                    "Please try again tomorrow."
                ),
            )
        _requests[ip].append(now)

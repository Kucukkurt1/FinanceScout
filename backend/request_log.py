from __future__ import annotations

import os
import time
import uuid
from collections import deque
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI
from starlette.requests import Request

_LOG: deque[dict[str, Any]] = deque(maxlen=200)
_QUOTA: dict[str, int] = {}
_DEFAULT_QUOTA_LIMIT = 500


def get_recent_logs() -> list[dict[str, Any]]:
    return list(_LOG)


def get_quota(symbol: str) -> dict[str, int]:
    sym = symbol.strip().upper()
    used = _QUOTA.get(sym, 0)
    return {"symbol": sym, "used": used, "limit": _DEFAULT_QUOTA_LIMIT}


def increment_quota(symbol: str) -> None:
    sym = symbol.strip().upper()
    _QUOTA[sym] = _QUOTA.get(sym, 0) + 1


def register_request_logging(app: FastAPI) -> None:
    """BaseHTTPMiddleware serverless'te askıda kalabiliyor; http middleware kullanılır."""

    @app.middleware("http")
    async def _request_log(request: Request, call_next):
        trace_id = request.headers.get("X-Trace-Id") or str(uuid.uuid4())
        started = time.perf_counter()
        response = await call_next(request)
        latency_ms = (time.perf_counter() - started) * 1000.0
        _LOG.append(
            {
                "trace_id": trace_id,
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "latency_ms": round(latency_ms, 2),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )
        response.headers["X-Trace-Id"] = trace_id
        return response


def require_admin_token(request: Request) -> None:
    from fastapi import HTTPException

    expected = os.environ.get("ADMIN_TOKEN")
    if not expected:
        return
    token = request.headers.get("X-Admin-Token")
    if token != expected:
        raise HTTPException(status_code=401, detail="Invalid or missing X-Admin-Token")

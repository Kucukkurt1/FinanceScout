"""Vercel rewrite öneklerini (/api, /_backend) FastAPI rotalarına uyumlu hale getirir."""

from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

_API_PREFIXES = ("/_backend", "/api")


class StripApiPrefixesMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.scope.get("path") or ""
        for prefix in _API_PREFIXES:
            if path == prefix or path.startswith(f"{prefix}/"):
                request.scope["path"] = path[len(prefix) :] or "/"
                break
        return await call_next(request)

from __future__ import annotations

from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class MarketEvent:
    date: date
    title: str
    category: str
    symbols: list[str]


# FOMC, ECB, OPEC, and selected earnings windows (2025–2026).
_MARKET_EVENTS: list[MarketEvent] = [
    MarketEvent(date(2025, 1, 29), "FOMC rate decision", "fomc", ["^GSPC", "EURUSD=X"]),
    MarketEvent(date(2025, 3, 19), "FOMC rate decision", "fomc", ["^GSPC", "EURUSD=X"]),
    MarketEvent(date(2025, 5, 7), "FOMC rate decision", "fomc", ["^GSPC", "EURUSD=X"]),
    MarketEvent(date(2025, 6, 18), "FOMC rate decision", "fomc", ["^GSPC", "EURUSD=X"]),
    MarketEvent(date(2025, 7, 30), "FOMC rate decision", "fomc", ["^GSPC", "EURUSD=X"]),
    MarketEvent(date(2025, 9, 17), "FOMC rate decision", "fomc", ["^GSPC", "EURUSD=X"]),
    MarketEvent(date(2025, 11, 5), "FOMC rate decision", "fomc", ["^GSPC", "EURUSD=X"]),
    MarketEvent(date(2025, 12, 17), "FOMC rate decision", "fomc", ["^GSPC", "EURUSD=X"]),
    MarketEvent(date(2026, 1, 28), "FOMC rate decision", "fomc", ["^GSPC", "EURUSD=X"]),
    MarketEvent(date(2026, 3, 18), "FOMC rate decision", "fomc", ["^GSPC", "EURUSD=X"]),
    MarketEvent(date(2026, 4, 30), "FOMC rate decision", "fomc", ["^GSPC", "EURUSD=X"]),
    MarketEvent(date(2026, 6, 17), "FOMC rate decision", "fomc", ["^GSPC", "EURUSD=X"]),
    MarketEvent(date(2026, 1, 30), "ECB monetary policy", "ecb", ["EURUSD=X", "^GDAXI"]),
    MarketEvent(date(2025, 3, 6), "ECB monetary policy", "ecb", ["EURUSD=X", "^GDAXI"]),
    MarketEvent(date(2025, 4, 17), "ECB monetary policy", "ecb", ["EURUSD=X", "^GDAXI"]),
    MarketEvent(date(2025, 6, 5), "ECB monetary policy", "ecb", ["EURUSD=X", "^GDAXI"]),
    MarketEvent(date(2025, 7, 24), "ECB monetary policy", "ecb", ["EURUSD=X", "^GDAXI"]),
    MarketEvent(date(2025, 9, 11), "ECB monetary policy", "ecb", ["EURUSD=X", "^GDAXI"]),
    MarketEvent(date(2025, 10, 30), "ECB monetary policy", "ecb", ["EURUSD=X", "^GDAXI"]),
    MarketEvent(date(2025, 12, 18), "ECB monetary policy", "ecb", ["EURUSD=X", "^GDAXI"]),
    MarketEvent(date(2026, 2, 5), "ECB monetary policy", "ecb", ["EURUSD=X", "^GDAXI"]),
    MarketEvent(date(2025, 3, 5), "OPEC+ ministerial meeting", "opec", ["CL=F", "BZ=F"]),
    MarketEvent(date(2025, 6, 1), "OPEC+ ministerial meeting", "opec", ["CL=F", "BZ=F"]),
    MarketEvent(date(2025, 12, 4), "OPEC+ ministerial meeting", "opec", ["CL=F", "BZ=F"]),
    MarketEvent(date(2026, 3, 4), "OPEC+ ministerial meeting", "opec", ["CL=F", "BZ=F"]),
    MarketEvent(date(2025, 1, 30), "AAPL earnings", "earnings", ["AAPL"]),
    MarketEvent(date(2025, 4, 30), "AAPL earnings", "earnings", ["AAPL"]),
    MarketEvent(date(2025, 7, 31), "AAPL earnings", "earnings", ["AAPL"]),
    MarketEvent(date(2025, 10, 30), "AAPL earnings", "earnings", ["AAPL"]),
    MarketEvent(date(2026, 1, 29), "AAPL earnings", "earnings", ["AAPL"]),
    MarketEvent(date(2025, 1, 29), "MSFT earnings", "earnings", ["MSFT"]),
    MarketEvent(date(2025, 4, 29), "MSFT earnings", "earnings", ["MSFT"]),
    MarketEvent(date(2025, 7, 29), "MSFT earnings", "earnings", ["MSFT"]),
    MarketEvent(date(2025, 10, 28), "MSFT earnings", "earnings", ["MSFT"]),
    MarketEvent(date(2026, 1, 28), "MSFT earnings", "earnings", ["MSFT"]),
    MarketEvent(date(2025, 2, 19), "NVDA earnings", "earnings", ["NVDA"]),
    MarketEvent(date(2025, 5, 28), "NVDA earnings", "earnings", ["NVDA"]),
    MarketEvent(date(2025, 8, 27), "NVDA earnings", "earnings", ["NVDA"]),
    MarketEvent(date(2025, 11, 19), "NVDA earnings", "earnings", ["NVDA"]),
    MarketEvent(date(2026, 2, 25), "NVDA earnings", "earnings", ["NVDA"]),
]


def list_events(from_date: date | None = None, to_date: date | None = None) -> list[MarketEvent]:
    out = _MARKET_EVENTS
    if from_date is not None:
        out = [e for e in out if e.date >= from_date]
    if to_date is not None:
        out = [e for e in out if e.date <= to_date]
    return sorted(out, key=lambda e: e.date)


def fomc_holiday_dates() -> list[str]:
    """YYYY-MM-DD strings for Prophet holidays (FOMC decision days)."""
    return sorted({e.date.isoformat() for e in _MARKET_EVENTS if e.category == "fomc"})

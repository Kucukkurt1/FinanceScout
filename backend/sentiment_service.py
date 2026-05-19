from __future__ import annotations

import logging
from datetime import date

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

_YAHOO_RSS = "https://finance.yahoo.com/news/rssindex"


def _fetch_rss_entries() -> list[dict]:
    try:
        import feedparser
    except ImportError:
        return []

    try:
        parsed = feedparser.parse(_YAHOO_RSS)
        return list(parsed.entries) if hasattr(parsed, "entries") else []
    except Exception as e:
        logger.warning("RSS fetch failed: %s", e)
        return []


def _entry_date(entry: dict) -> date | None:
    for key in ("published_parsed", "updated_parsed"):
        tp = entry.get(key)
        if tp:
            return date(tp[0], tp[1], tp[2])
    for key in ("published", "updated"):
        raw = entry.get(key)
        if raw:
            try:
                return pd.Timestamp(raw).date()
            except Exception:
                pass
    return None


def build_sentiment_series(dates: list[date] | pd.DatetimeIndex) -> pd.Series:
    """Daily event_intensity in [0, 1] for Prophet regressor; zeros on failure."""
    if isinstance(dates, pd.DatetimeIndex):
        day_index = [d.date() for d in dates.normalize().unique()]
    else:
        day_index = sorted({d for d in dates})

    if not day_index:
        return pd.Series(dtype=float)

    entries = _fetch_rss_entries()
    if not entries:
        return pd.Series(0.0, index=pd.to_datetime(day_index))

    counts: dict[date, int] = {}
    for entry in entries:
        d = _entry_date(entry)
        if d is not None:
            counts[d] = counts.get(d, 0) + 1

    max_count = max(counts.values()) if counts else 1
    values = [min(counts.get(d, 0) / max_count, 1.0) for d in day_index]
    return pd.Series(values, index=pd.to_datetime(day_index))


def sentiment_for_training(train_ds: pd.Series) -> pd.Series | None:
    """Align sentiment regressor to training dates."""
    try:
        days = [pd.Timestamp(x).date() for x in train_ds]
        series = build_sentiment_series(days)
        aligned = series.reindex(pd.to_datetime(train_ds).dt.normalize())
        aligned = aligned.fillna(0.0)
        if aligned.sum() == 0 and not _fetch_rss_entries():
            return None
        return aligned
    except Exception as e:
        logger.warning("Sentiment series build failed: %s", e)
        return None

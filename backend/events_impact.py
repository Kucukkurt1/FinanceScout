from __future__ import annotations

from datetime import date

import numpy as np
import pandas as pd

from data_service import fetch_history
from events import list_events
from model_profiles import get_profile, resolve_asset_class
from prophet_service import fit_and_forecast


def _price_col(df: pd.DataFrame) -> str:
    return "y_orig" if "y_orig" in df.columns else "y"


def _event_window_return(df: pd.DataFrame, event_date: date, window_days: int) -> float | None:
    if df.empty:
        return None
    work = df.copy()
    work["ds"] = pd.to_datetime(work["ds"]).dt.tz_localize(None).dt.normalize()
    ed = pd.Timestamp(event_date).normalize()
    col = _price_col(work)

    before = work[work["ds"] < ed]
    if before.empty:
        return None
    p0 = float(before.iloc[-1][col])
    if p0 <= 0 or not np.isfinite(p0):
        return None

    after = work[work["ds"] >= ed]
    if len(after) < 2:
        return None
    idx = min(window_days, len(after) - 1)
    p1 = float(after.iloc[idx][col])
    if not np.isfinite(p1):
        return None
    return float((p1 - p0) / p0)


def analyze_event_impact(
    symbol: str,
    event_date: date,
    category: str,
    *,
    event_title: str | None = None,
    window_days: int = 5,
) -> dict:
    """Benzer geçmiş olaylardan ortalama getiri + kısa ufuk model tahmini."""
    sym = symbol.strip().upper()
    today = date.today()
    hist = fetch_history(sym, 1095)
    df = hist.copy()

    similar = [
        e
        for e in list_events()
        if e.category == category and sym in e.symbols and e.date < today
    ]

    returns: list[float] = []
    similar_titles: list[str] = []
    for ev in similar:
        if ev.date == event_date and event_title and ev.title == event_title:
            continue
        r = _event_window_return(df, ev.date, window_days)
        if r is not None and np.isfinite(r):
            returns.append(r)
            similar_titles.append(f"{ev.title} ({ev.date.isoformat()})")

    avg_ret = float(np.mean(returns)) if returns else None
    med_ret = float(np.median(returns)) if returns else None

    profile = get_profile(resolve_asset_class(sym, "auto"))
    hist_tail = df.tail(min(365, len(df)))
    forecast_days = max(5, min(14, window_days + 3))
    _, fut_fc = fit_and_forecast(hist_tail, forecast_days, profile)

    col = _price_col(df)
    current = float(df[col].iloc[-1])
    model_pct: float | None = None
    if len(fut_fc) > 0 and current > 0:
        target = float(fut_fc["yhat"].iloc[-1])
        if np.isfinite(target):
            model_pct = float((target - current) / current * 100.0)

    hist_signal = avg_ret if avg_ret is not None else 0.0
    model_signal = (model_pct / 100.0) if model_pct is not None else 0.0

    if len(returns) >= 3:
        combined = 0.55 * hist_signal + 0.45 * model_signal
    elif len(returns) >= 1:
        combined = 0.5 * hist_signal + 0.5 * model_signal
    else:
        combined = model_signal

    if combined > 0.004:
        direction = "up"
        direction_label = "Yükseliş eğilimi"
    elif combined < -0.004:
        direction = "down"
        direction_label = "Düşüş eğilimi"
    else:
        direction = "neutral"
        direction_label = "Belirsiz / nötr"

    pct_hist = f"{avg_ret * 100:+.1f}%" if avg_ret is not None else "—"
    pct_model = f"{model_pct:+.1f}%" if model_pct is not None else "—"
    summary = (
        f"{sym} için «{event_title or category}» benzeri {len(returns)} geçmiş olayda "
        f"olay sonrası ~{window_days} iş günü ortalama getiri {pct_hist}. "
        f"Güncel model kısa ufuk tahmini: {pct_model}. "
        f"Birleşik yön: {direction_label}."
    )

    return {
        "symbol": sym,
        "event_date": event_date.isoformat(),
        "category": category,
        "event_title": event_title,
        "window_days": window_days,
        "historical_samples": len(returns),
        "avg_event_return_pct": avg_ret * 100.0 if avg_ret is not None else None,
        "median_event_return_pct": med_ret * 100.0 if med_ret is not None else None,
        "model_forecast_return_pct": model_pct,
        "direction": direction,
        "direction_label": direction_label,
        "summary": summary,
        "similar_events": similar_titles[:8],
    }

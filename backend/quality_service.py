from __future__ import annotations

import numpy as np
import pandas as pd

from data_service import fetch_history


def analyze_quality(symbol: str, history_days: int) -> dict:
    """Data quality: missing business days, >5σ outliers, >15% daily jumps."""
    hist = fetch_history(symbol, history_days)
    hist = hist.sort_values("ds").reset_index(drop=True)
    ds = pd.to_datetime(hist["ds"])
    y = hist["y"].astype(float)

    if len(ds) < 2:
        return {"symbol": symbol.strip().upper(), "missing_days": 0, "outliers": [], "jump_days": []}

    full_range = pd.date_range(ds.min(), ds.max(), freq="B")
    present = set(ds.dt.normalize())
    missing_days = int(sum(1 for d in full_range if d not in present))

    rets = y.pct_change().dropna()
    outliers: list[str] = []
    jump_days: list[str] = []

    if len(rets) >= 5:
        mu = float(rets.mean())
        sigma = float(rets.std(ddof=1))
        if sigma > 0:
            z = (rets - mu) / sigma
            for idx in rets.index[z.abs() > 5]:
                ds_i = ds.loc[idx]
                outliers.append(ds_i.strftime("%Y-%m-%d"))

    for idx in rets.index[rets.abs() > 0.15]:
        jump_days.append(ds.loc[idx].strftime("%Y-%m-%d"))

    return {
        "symbol": symbol.strip().upper(),
        "missing_days": missing_days,
        "outliers": outliers,
        "jump_days": jump_days,
    }

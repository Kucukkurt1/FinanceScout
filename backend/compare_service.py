from __future__ import annotations

import numpy as np
import pandas as pd

from data_service import daily_returns_volatility, fetch_history


def compare_symbols(symbols: list[str], history_days: int) -> dict:
    """Per-symbol 30d return, annualized vol, and return correlation matrix."""
    cleaned = [s.strip().upper() for s in symbols if s.strip()]
    if len(cleaned) < 1:
        raise ValueError("At least one symbol is required.")
    if len(cleaned) > 10:
        raise ValueError("At most 10 symbols allowed.")

    per_symbol: list[dict] = []
    return_series: dict[str, pd.Series] = {}

    for sym in cleaned:
        hist = fetch_history(sym, history_days)
        prices = hist.set_index("ds")["y"].astype(float)
        rets = np.log(prices / prices.shift(1)).dropna()

        return_30d: float | None = None
        if len(prices) >= 31:
            p0 = float(prices.iloc[-31])
            p1 = float(prices.iloc[-1])
            if p0 > 0:
                return_30d = float((p1 / p0) - 1.0)

        _, vol_annual = daily_returns_volatility(prices, annualization=252)
        per_symbol.append(
            {
                "symbol": sym,
                "return_30d": return_30d,
                "vol_annual": float(vol_annual) if np.isfinite(vol_annual) else None,
            }
        )
        return_series[sym] = rets

    labels = list(return_series.keys())
    n = len(labels)
    matrix: list[list[float | None]] = [[None] * n for _ in range(n)]

    for i, si in enumerate(labels):
        matrix[i][i] = 1.0
        for j in range(i + 1, n):
            sj = labels[j]
            aligned = pd.concat([return_series[si], return_series[sj]], axis=1, join="inner").dropna()
            if len(aligned) < 5:
                corr = None
            else:
                corr = float(aligned.iloc[:, 0].corr(aligned.iloc[:, 1]))
            matrix[i][j] = corr
            matrix[j][i] = corr

    return {"symbols": per_symbol, "correlation_labels": labels, "correlation": matrix}

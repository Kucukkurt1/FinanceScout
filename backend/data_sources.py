from __future__ import annotations

from typing import Protocol

import pandas as pd
import yfinance as yf


class DataSource(Protocol):
    def fetch_period(self, symbol: str, history_days: int) -> pd.DataFrame: ...
    def fetch_range(self, symbol: str, start: str, end: str | None) -> pd.DataFrame: ...


def _normalize_ohlcv(df: pd.DataFrame, symbol: str) -> pd.DataFrame:
    if df is None or df.empty:
        raise ValueError(f"No data returned for symbol '{symbol}'.")

    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    if "Close" not in df.columns:
        raise ValueError(f"Unexpected response shape for '{symbol}' (missing Close).")

    close = df["Close"].astype(float).dropna()
    if close.empty:
        raise ValueError(f"Close series is empty for '{symbol}'.")

    out = close.reset_index()
    date_col = out.columns[0]
    out = out.rename(columns={date_col: "ds", "Close": "y"})
    out["ds"] = pd.to_datetime(out["ds"]).dt.normalize().dt.tz_localize(None)
    out = out.drop_duplicates(subset=["ds"]).sort_values("ds").reset_index(drop=True)
    return out[["ds", "y"]]


class YFinanceSource:
    def fetch_period(self, symbol: str, history_days: int) -> pd.DataFrame:
        symbol = symbol.strip().upper()
        df = yf.download(
            symbol,
            period=f"{history_days}d",
            interval="1d",
            progress=False,
            auto_adjust=False,
        )
        return _normalize_ohlcv(df, symbol)

    def fetch_range(self, symbol: str, start: str, end: str | None) -> pd.DataFrame:
        symbol = symbol.strip().upper()
        end_param = end
        if end_param:
            end_ts = pd.Timestamp(end_param).normalize() + pd.Timedelta(days=1)
            end_param = end_ts.strftime("%Y-%m-%d")

        if end_param:
            df = yf.download(
                symbol,
                start=start,
                end=end_param,
                interval="1d",
                progress=False,
                auto_adjust=False,
            )
        else:
            df = yf.download(
                symbol,
                start=start,
                interval="1d",
                progress=False,
                auto_adjust=False,
            )
        return _normalize_ohlcv(df, symbol)


def _stooq_ticker(symbol: str) -> str:
    s = symbol.strip().upper()
    if s.endswith(".IS"):
        return s.lower()
    if "." not in s and "=" not in s and "-" not in s:
        return f"{s.lower()}.us"
    return s.lower().replace("-", ".")


class StooqSource:
    """Daily CSV from Stooq (fallback when Yahoo fails)."""

    _BASE = "https://stooq.com/q/d/l/"

    def fetch_period(self, symbol: str, history_days: int) -> pd.DataFrame:
        df = self._download(symbol)
        if len(df) > history_days:
            df = df.tail(history_days).reset_index(drop=True)
        return df

    def fetch_range(self, symbol: str, start: str, end: str | None) -> pd.DataFrame:
        df = self._download(symbol)
        start_ts = pd.Timestamp(start).normalize()
        mask = df["ds"] >= start_ts
        if end:
            end_ts = pd.Timestamp(end).normalize()
            mask &= df["ds"] <= end_ts
        out = df.loc[mask].reset_index(drop=True)
        if out.empty:
            raise ValueError(f"No Stooq data for '{symbol}' in range {start} → {end or 'now'}.")
        return out

    def _download(self, symbol: str) -> pd.DataFrame:
        sym = symbol.strip().upper()
        ticker = _stooq_ticker(sym)
        url = f"{self._BASE}?s={ticker}&i=d"
        raw = pd.read_csv(url)
        if raw is None or raw.empty:
            raise ValueError(f"Stooq returned no rows for '{sym}'.")
        raw["Date"] = pd.to_datetime(raw["Date"])
        out = raw.rename(columns={"Date": "ds", "Close": "y"})[["ds", "y"]]
        out["ds"] = out["ds"].dt.normalize().dt.tz_localize(None)
        out["y"] = out["y"].astype(float)
        out = out.dropna(subset=["y"]).drop_duplicates(subset=["ds"]).sort_values("ds")
        return out.reset_index(drop=True)


class SyntheticCrossSource:
    """Yahoo'da doğrudan bulunmayan XXXTRY=X pariteleri için sentetik seri.

    Formül: 1 XXX = (USDTRY=X) / (XXX=X) TRY, çünkü Yahoo'da `XXX=X` USD/XXX
    oranını verir. Örnek: KWDTRY = USDTRY=X / KWD=X.
    """

    _SUFFIX = "TRY=X"

    def _components(self, symbol: str) -> tuple[str, str] | None:
        s = symbol.strip().upper()
        if not s.endswith(self._SUFFIX) or s == "USDTRY=X":
            return None
        base = s[: -len(self._SUFFIX)]
        if len(base) != 3 or not base.isalpha():
            return None
        return f"{base}=X", "USDTRY=X"

    def _combine(self, usd_base: pd.DataFrame, usd_try: pd.DataFrame) -> pd.DataFrame:
        merged = usd_try.merge(usd_base, on="ds", suffixes=("_try", "_base"))
        merged = merged[(merged["y_base"] > 0) & (merged["y_try"] > 0)]
        if merged.empty:
            raise ValueError("Synthetic cross merge produced no overlapping points.")
        merged["y"] = merged["y_try"] / merged["y_base"]
        return merged[["ds", "y"]].reset_index(drop=True)

    def fetch_period(self, symbol: str, history_days: int) -> pd.DataFrame:
        parts = self._components(symbol)
        if parts is None:
            raise ValueError(f"Synthetic source not applicable to '{symbol}'.")
        usd_base_sym, usd_try_sym = parts
        yf_src = YFinanceSource()
        usd_base = yf_src.fetch_period(usd_base_sym, history_days)
        usd_try = yf_src.fetch_period(usd_try_sym, history_days)
        return self._combine(usd_base, usd_try)

    def fetch_range(self, symbol: str, start: str, end: str | None) -> pd.DataFrame:
        parts = self._components(symbol)
        if parts is None:
            raise ValueError(f"Synthetic source not applicable to '{symbol}'.")
        usd_base_sym, usd_try_sym = parts
        yf_src = YFinanceSource()
        usd_base = yf_src.fetch_range(usd_base_sym, start, end)
        usd_try = yf_src.fetch_range(usd_try_sym, start, end)
        return self._combine(usd_base, usd_try)


_SOURCES: list[DataSource] = [YFinanceSource(), StooqSource(), SyntheticCrossSource()]

_MIN_ROWS = 20


def _best_result(results: list[pd.DataFrame]) -> pd.DataFrame | None:
    """Yeterli satır içeren ilk seriyi, yoksa en uzun seriyi döndürür."""

    if not results:
        return None
    for df in results:
        if df is not None and len(df) >= _MIN_ROWS:
            return df
    return max(results, key=lambda d: 0 if d is None else len(d))


def fetch_period_chain(symbol: str, history_days: int) -> pd.DataFrame:
    last_err: Exception | None = None
    successes: list[pd.DataFrame] = []
    for src in _SOURCES:
        try:
            df = src.fetch_period(symbol, history_days)
            if df is None or df.empty:
                continue
            successes.append(df)
            if len(df) >= _MIN_ROWS:
                return df
        except Exception as e:
            last_err = e
    best = _best_result(successes)
    if best is not None and not best.empty:
        return best
    raise ValueError(f"All data sources failed for '{symbol}': {last_err}")


def fetch_range_chain(symbol: str, start: str, end: str | None) -> pd.DataFrame:
    last_err: Exception | None = None
    successes: list[pd.DataFrame] = []
    for src in _SOURCES:
        try:
            df = src.fetch_range(symbol, start, end)
            if df is None or df.empty:
                continue
            successes.append(df)
            if len(df) >= _MIN_ROWS:
                return df
        except Exception as e:
            last_err = e
    best = _best_result(successes)
    if best is not None and not best.empty:
        return best
    raise ValueError(f"All data sources failed for '{symbol}': {last_err}")

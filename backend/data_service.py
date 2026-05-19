from __future__ import annotations

import numpy as np
import pandas as pd
import yfinance as yf
from cachetools import TTLCache

_RANGE_CACHE: TTLCache = TTLCache(maxsize=128, ttl=300)


def _cache_key_range(symbol: str, start: str, end: str | None) -> str:
    return f"r:{symbol.strip().upper()}:{start}:{end or ''}"


def fetch_history(symbol: str, history_days: int) -> pd.DataFrame:
    from data_sources import fetch_range_chain

    end = pd.Timestamp.today().strftime("%Y-%m-%d")
    start = (pd.Timestamp.today() - pd.DateOffset(days=history_days + 30)).strftime("%Y-%m-%d")
    return fetch_range_chain(symbol, start, end).tail(history_days + 5)


def fetch_history_range(symbol: str, start: str, end: str | None = None) -> pd.DataFrame:
    """Daily close between start and end (inclusive when end is set)."""
    from data_sources import fetch_range_chain

    key = _cache_key_range(symbol, start, end)
    if key in _RANGE_CACHE:
        return _RANGE_CACHE[key].copy()

    df = fetch_range_chain(symbol, start, end)
    _RANGE_CACHE[key] = df.copy()
    return df


_MARKET_NAMES = {
    "BTC-USD": "Bitcoin",
    "ETH-USD": "Ethereum",
    "USDTRY=X": "Dolar / TL",
    "EURTRY=X": "Euro / TL",
    "GBPTRY=X": "Sterlin / TL",
    "GC=F": "Altın (Ons)",
    "SI=F": "Gümüş",
    "BZ=F": "Brent Petrol",
    "^GSPC": "S&P 500",
    "^IXIC": "Nasdaq",
    "^DJI": "Dow Jones",
    "^XU100": "BIST 100",
    "THYAO.IS": "Türk Hava Yolları",
    "ASELS.IS": "Aselsan",
    "SISE.IS": "Şişecam",
    "KCHOL.IS": "Koç Holding",
    "AAPL": "Apple",
    "MSFT": "Microsoft",
    "NVDA": "Nvidia",
    "TSLA": "Tesla",
    "META": "Meta",
    "GOOGL": "Alphabet",
    "AMZN": "Amazon",
    "EURUSD=X": "Euro / Dolar",
    "JPYTRY=X": "Japon Yeni / TL",
    "GARAN.IS": "Garanti BBVA",
    "AKBNK.IS": "Akbank",
    "EREGL.IS": "Ereğli Demir Çelik",
    "TUPRS.IS": "Tüpraş",
    "BIMAS.IS": "BİM",
}


def _summary_from_history(sym: str, hist: pd.DataFrame) -> dict | None:
    if hist is None or hist.empty:
        return None
    close_col = "Close" if "Close" in hist.columns else hist.columns[-1]
    closes = hist[close_col].dropna()
    if len(closes) < 2:
        return None
    current_price = float(closes.iloc[-1])
    prev_price = float(closes.iloc[-2])
    if prev_price == 0:
        return None
    change_pct = ((current_price - prev_price) / prev_price) * 100
    return {
        "symbol": sym,
        "price": current_price,
        "change_pct": change_pct,
        "name": _MARKET_NAMES.get(sym, sym),
    }


def _fetch_one_market_symbol(sym: str) -> dict | None:
    try:
        hist = yf.Ticker(sym).history(period="5d", interval="1d", auto_adjust=True)
        return _summary_from_history(sym, hist)
    except Exception:
        return None


def fetch_market_summary(symbols: list[str]) -> list[dict]:
    """Son fiyat ve günlük değişim — önce toplu, olmazsa sembol sembol."""
    results: list[dict] = []
    pending = list(symbols)

    try:
        df = yf.download(pending, period="5d", interval="1d", progress=False, group_by="ticker", auto_adjust=True)
        if df is not None and not df.empty:
            for sym in pending:
                try:
                    if len(pending) > 1:
                        ticker_df = df[sym].copy()
                    else:
                        ticker_df = df.copy()
                    row = _summary_from_history(sym, ticker_df)
                    if row:
                        results.append(row)
                except Exception:
                    continue
    except Exception:
        pass

    got = {r["symbol"] for r in results}
    for sym in pending:
        if sym in got:
            continue
        row = _fetch_one_market_symbol(sym)
        if row:
            results.append(row)

    order = {s: i for i, s in enumerate(symbols)}
    results.sort(key=lambda r: order.get(r["symbol"], 999))
    return results


def daily_returns_volatility(prices: pd.Series, annualization: int = 252) -> tuple[float, float]:
    """Log-return daily std and annualized std."""
    r = np.log(prices / prices.shift(1)).dropna()
    if len(r) < 2:
        return float("nan"), float("nan")
    daily = float(r.std(ddof=1))
    annual = daily * (annualization**0.5)
    return daily, annual

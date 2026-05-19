from __future__ import annotations

import math
import os
import uuid
from datetime import date, datetime, timezone
from typing import Any

import pandas as pd
from fastapi import APIRouter, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from instrumentation import init_sentry

init_sentry()

from compare_service import compare_symbols
from data_service import fetch_history, fetch_history_range, fetch_market_summary
from events import list_events
from events_impact import analyze_event_impact
from model_profiles import get_profile, resolve_asset_class
from prophet_service import backtest_split, cutoff_train_forecast, fit_and_forecast
from quality_service import analyze_quality
from request_log import increment_quota, register_request_logging
from schemas import (
    BacktestRequest,
    BacktestResponse,
    CompareRequest,
    CompareResponse,
    EventImpactRequest,
    EventImpactResponse,
    EventsListResponse,
    FeedbackRequest,
    FeedbackResponse,
    ForecastRequest,
    ForecastResponse,
    HealthResponse,
    MarketEventOut,
    MarketItem,
    MarketSummaryResponse,
    Metrics,
    QualityResponse,
    SeriesPoint,
    SymbolCompareStats,
    SymbolSearchResponse,
)
from symbol_search import search_symbols

def _cors_origins() -> list[str]:
    origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://[::1]:3000",
    ]
    for key in ("VERCEL_URL", "VERCEL_BRANCH_URL", "VERCEL_PROJECT_PRODUCTION_URL"):
        host = os.environ.get(key, "").strip()
        if host:
            origins.append(f"https://{host}")
    return origins


app = FastAPI(title="FinanceScout API", version="0.2.0")
api = APIRouter()

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Trace-Id"],
)
register_request_logging(app)

_FEEDBACK_STORE: list[dict[str, Any]] = []


def _finite_or_none(x: Any) -> float | None:
    if x is None:
        return None
    try:
        xf = float(x)
    except (TypeError, ValueError):
        return None
    if math.isnan(xf) or math.isinf(xf):
        return None
    return xf


def _metrics_from_dict(d: dict[str, Any]) -> Metrics:
    regime = d.get("regime")
    if regime not in ("low_vol", "high_vol"):
        regime = None
    return Metrics(
        rmse=_finite_or_none(d.get("rmse")),
        mae=_finite_or_none(d.get("mae")),
        mape=_finite_or_none(d.get("mape")),
        volatility_daily=_finite_or_none(d.get("volatility_daily")),
        volatility_annualized=_finite_or_none(d.get("volatility_annualized")),
        volatility_annualization_days=d.get("volatility_annualization_days"),
        holdout_points=d.get("holdout_points"),
        mean_bias=_finite_or_none(d.get("mean_bias")),
        regime=regime,
        walk_forward_rmse=_finite_or_none(d.get("walk_forward_rmse")),
        conformal_half_width=_finite_or_none(d.get("conformal_half_width")),
    )


def _load_history(req_symbol: str, history_days: int, train_until: str | None, data_start: str | None) -> pd.DataFrame:
    symbol = req_symbol.strip().upper()
    if train_until:
        tu = pd.Timestamp(train_until).normalize()
        start_s = data_start or (tu - pd.DateOffset(years=18)).strftime("%Y-%m-%d")
        return fetch_history_range(symbol, start=start_s, end=None)
    return fetch_history(symbol, history_days)


def _history_points_from_fc(hist: pd.DataFrame, hist_fc: pd.DataFrame) -> list[SeriesPoint]:
    points: list[SeriesPoint] = []
    for _, row in hist.iterrows():
        ds = row["ds"]
        match = hist_fc[hist_fc["ds"].dt.normalize() == ds.normalize()]
        if not match.empty:
            r = match.iloc[0]
            points.append(
                SeriesPoint(
                    ds=ds.strftime("%Y-%m-%d"),
                    y=float(row["y"]),
                    yhat=float(r["yhat"]),
                    yhat_lower=float(r["yhat_lower"]),
                    yhat_upper=float(r["yhat_upper"]),
                )
            )
        else:
            points.append(SeriesPoint(ds=ds.strftime("%Y-%m-%d"), y=float(row["y"])))
    return points


def _row_to_point_forecast(row: pd.Series) -> SeriesPoint:
    return SeriesPoint(
        ds=row["ds"].strftime("%Y-%m-%d"),
        y=None,
        yhat=float(row["yhat"]),
        yhat_lower=float(row["yhat_lower"]),
        yhat_upper=float(row["yhat_upper"]),
    )


@api.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@api.get("/market-summary", response_model=MarketSummaryResponse)
def market_summary() -> MarketSummaryResponse:
    symbols = [
        "BTC-USD",
        "ETH-USD",
        "USDTRY=X",
        "EURTRY=X",
        "GBPTRY=X",
        "GC=F",
        "SI=F",
        "BZ=F",
        "^GSPC",
        "^IXIC",
        "^DJI",
        "^XU100",
        "THYAO.IS",
        "ASELS.IS",
        "SISE.IS",
        "KCHOL.IS",
        "AAPL",
        "MSFT",
        "NVDA",
        "TSLA",
        "META",
        "GOOGL",
        "AMZN",
        "EURUSD=X",
        "JPYTRY=X",
        "GARAN.IS",
        "AKBNK.IS",
        "EREGL.IS",
        "TUPRS.IS",
        "BIMAS.IS",
    ]
    items = fetch_market_summary(symbols)
    return MarketSummaryResponse(items=[MarketItem(**item) for item in items])


@api.get("/symbols/search", response_model=SymbolSearchResponse)
def symbols_search(q: str = Query("", min_length=0, max_length=64)) -> SymbolSearchResponse:
    results = search_symbols(q, limit=25)
    return SymbolSearchResponse(symbols=[r.symbol for r in results], results=results)


@api.get("/events", response_model=EventsListResponse)
def events(
    from_date: date | None = Query(None, alias="from"),
    to_date: date | None = Query(None, alias="to"),
) -> EventsListResponse:
    rows = list_events(from_date, to_date)
    return EventsListResponse(
        events=[
            MarketEventOut(
                date=e.date.isoformat(),
                title=e.title,
                category=e.category,
                symbols=e.symbols,
            )
            for e in rows
        ]
    )


@api.post("/events/impact", response_model=EventImpactResponse)
def event_impact(body: EventImpactRequest) -> EventImpactResponse:
    try:
        ed = date.fromisoformat(body.event_date.strip())
        result = analyze_event_impact(
            body.symbol,
            ed,
            body.category.strip().lower(),
            event_title=body.event_title,
            window_days=body.window_days,
        )
        return EventImpactResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Event impact error: {e!s}") from e


@api.post("/compare", response_model=CompareResponse)
def compare(body: CompareRequest) -> CompareResponse:
    try:
        result = compare_symbols(body.symbols, body.history_days)
        return CompareResponse(
            symbols=[SymbolCompareStats(**s) for s in result["symbols"]],
            correlation_labels=result["correlation_labels"],
            correlation=result["correlation"],
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Compare error: {e!s}") from e


@api.get("/quality", response_model=QualityResponse)
def quality(
    symbol: str = Query(..., min_length=1),
    history_days: int = Query(365, ge=30, le=3650),
) -> QualityResponse:
    try:
        result = analyze_quality(symbol, history_days)
        return QualityResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Quality error: {e!s}") from e


@api.post("/feedback", response_model=FeedbackResponse)
def feedback(body: FeedbackRequest) -> FeedbackResponse:
    entry_id = str(uuid.uuid4())
    received = datetime.now(timezone.utc).isoformat()
    _FEEDBACK_STORE.append(
        {
            "id": entry_id,
            "received_at": received,
            "rating": body.rating,
            "message": body.message,
            "symbol": body.symbol,
            "endpoint": body.endpoint,
        }
    )
    return FeedbackResponse(id=entry_id, received_at=received)


@api.post("/forecast", response_model=ForecastResponse)
def forecast(body: ForecastRequest) -> ForecastResponse:
    try:
        symbol = body.symbol.strip().upper()
        increment_quota(symbol)
        asset_class = resolve_asset_class(body.symbol, body.asset_class)
        profile = get_profile(asset_class)
        hist = _load_history(body.symbol, body.history_days, body.train_until, body.data_start)

        train_until_used: str | None = None
        holdout_actual: list[SeriesPoint] | None = None
        holdout_predicted: list[SeriesPoint] | None = None

        if body.train_until:
            tu = pd.Timestamp(body.train_until).normalize().tz_localize(None)
            train_until_used = tu.strftime("%Y-%m-%d")
            fc_keep, fut_tail, merged_holdout, mdict = cutoff_train_forecast(hist, tu, body.forecast_days, profile)

            history_points = _history_points_from_fc(hist, fc_keep)
            forecast_points = [_row_to_point_forecast(row) for _, row in fut_tail.iterrows()]
            metrics = _metrics_from_dict(mdict)

            if len(merged_holdout) > 0:
                holdout_actual = [
                    SeriesPoint(ds=r["ds"].strftime("%Y-%m-%d"), y=float(r["y"])) for _, r in merged_holdout.iterrows()
                ]
                holdout_predicted = [
                    SeriesPoint(
                        ds=r["ds"].strftime("%Y-%m-%d"),
                        yhat=float(r["yhat"]),
                        yhat_lower=float(r["yhat_lower"]),
                        yhat_upper=float(r["yhat_upper"]),
                    )
                    for _, r in merged_holdout.iterrows()
                ]

            return ForecastResponse(
                symbol=symbol,
                asset_class=asset_class,
                history=history_points,
                forecast=forecast_points,
                backtest_metrics=metrics,
                train_until_used=train_until_used,
                holdout_actual=holdout_actual,
                holdout_predicted=holdout_predicted,
            )

        hist_fc, fut_fc = fit_and_forecast(hist, body.forecast_days, profile)
        mdict, _, _ = backtest_split(hist, test_fraction=0.2, profile=profile)

        history_points = _history_points_from_fc(hist, hist_fc)
        forecast_points = [_row_to_point_forecast(row) for _, row in fut_fc.iterrows()]
        metrics = _metrics_from_dict(mdict)

        return ForecastResponse(
            symbol=symbol,
            asset_class=asset_class,
            history=history_points,
            forecast=forecast_points,
            backtest_metrics=metrics,
            train_until_used=None,
            holdout_actual=None,
            holdout_predicted=None,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Upstream or model error: {e!s}") from e


@api.post("/backtest", response_model=BacktestResponse)
def backtest(body: BacktestRequest) -> BacktestResponse:
    try:
        symbol = body.symbol.strip().upper()
        increment_quota(symbol)
        asset_class = resolve_asset_class(body.symbol, body.asset_class)
        profile = get_profile(asset_class)
        hist = _load_history(body.symbol, body.history_days, body.train_until, body.data_start)

        if body.train_until:
            tu = pd.Timestamp(body.train_until).normalize().tz_localize(None)
            _fc_keep, _fut_tail, merged_holdout, mdict = cutoff_train_forecast(hist, tu, forecast_days=30, profile=profile)

            if len(merged_holdout) < 3:
                raise ValueError("Kesit modunda karşılaştırılacak yeterli tarih yok (train_until çok geç olabilir).")

            test_actual = [
                SeriesPoint(ds=r["ds"].strftime("%Y-%m-%d"), y=float(r["y"])) for _, r in merged_holdout.iterrows()
            ]
            test_predicted = [
                SeriesPoint(
                    ds=r["ds"].strftime("%Y-%m-%d"),
                    yhat=float(r["yhat"]),
                    yhat_lower=float(r["yhat_lower"]),
                    yhat_upper=float(r["yhat_upper"]),
                )
                for _, r in merged_holdout.iterrows()
            ]

            metrics = _metrics_from_dict(mdict)

            return BacktestResponse(
                symbol=symbol,
                asset_class=asset_class,
                metrics=metrics,
                test_actual=test_actual,
                test_predicted=test_predicted,
            )

        mdict, actual_df, pred_df = backtest_split(hist, body.test_fraction, profile=profile)

        test_actual = [
            SeriesPoint(ds=r["ds"].strftime("%Y-%m-%d"), y=float(r["y"])) for _, r in actual_df.iterrows()
        ]
        test_predicted = [
            SeriesPoint(
                ds=r["ds"].strftime("%Y-%m-%d"),
                yhat=float(r["yhat"]),
                yhat_lower=float(r["yhat_lower"]),
                yhat_upper=float(r["yhat_upper"]),
            )
            for _, r in pred_df.iterrows()
        ]

        metrics = _metrics_from_dict(mdict)

        return BacktestResponse(
            symbol=symbol,
            asset_class=asset_class,
            metrics=metrics,
            test_actual=test_actual,
            test_predicted=test_predicted,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Upstream or model error: {e!s}") from e


# Kök rotalar (doğrudan uvicorn) + Vercel Services proxy öneki /_backend
app.include_router(api)
app.include_router(api, prefix="/_backend")

# Vercel @vercel/python serverless giriş noktası (yerelde uvicorn kullanılır)
try:
    from mangum import Mangum

    handler = Mangum(app, lifespan="off")
except ImportError:
    handler = None  # type: ignore[misc, assignment]

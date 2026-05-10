from __future__ import annotations

from pydantic import BaseModel, Field


class ForecastRequest(BaseModel):
    symbol: str = Field(..., min_length=1, description="Yahoo Finance ticker, e.g. BTC-USD, EURUSD=X")
    history_days: int = Field(default=365, ge=30, le=3650)
    forecast_days: int = Field(default=9, ge=1, le=90)


class SeriesPoint(BaseModel):
    ds: str
    y: float | None = None
    yhat: float | None = None
    yhat_lower: float | None = None
    yhat_upper: float | None = None


class Metrics(BaseModel):
    rmse: float | None = None
    mae: float | None = None
    volatility_daily: float | None = None
    volatility_annualized: float | None = None


class ForecastResponse(BaseModel):
    symbol: str
    history: list[SeriesPoint]
    forecast: list[SeriesPoint]
    backtest_metrics: Metrics


class BacktestRequest(BaseModel):
    symbol: str = Field(..., min_length=1)
    history_days: int = Field(default=365, ge=30, le=3650)
    test_fraction: float = Field(default=0.2, gt=0.05, lt=0.5)


class BacktestResponse(BaseModel):
    symbol: str
    metrics: Metrics
    test_actual: list[SeriesPoint]
    test_predicted: list[SeriesPoint]


class HealthResponse(BaseModel):
    status: str

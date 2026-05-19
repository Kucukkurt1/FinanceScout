from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, HttpUrl


AssetClassParam = Literal["auto", "crypto", "fx", "stock"]
RegimeLabel = Literal["low_vol", "high_vol"]


class ForecastRequest(BaseModel):
    symbol: str = Field(..., min_length=1, description="Yahoo Finance ticker, e.g. BTC-USD, EURUSD=X")
    history_days: int = Field(default=365, ge=30, le=3650)
    forecast_days: int = Field(default=9, ge=1, le=730)
    asset_class: AssetClassParam = Field(
        default="auto",
        description="auto: ticker kalıbından tahmin; aksi halde Prophet/volatilite profili sabitlenir.",
    )
    train_until: str | None = Field(
        default=None,
        description="YYYY-MM-DD — modele bu tarihe kadar (dahil) veri gösterilir; sonrası gerçek fiyatlarla kıyaslanır.",
    )
    data_start: str | None = Field(
        default=None,
        description="İndirme başlangıcı (YYYY-MM-DD). train_until kullanılıyorsa boş bırakılırsa train_until - 18 yıl.",
    )


class SeriesPoint(BaseModel):
    ds: str
    y: float | None = None
    yhat: float | None = None
    yhat_lower: float | None = None
    yhat_upper: float | None = None


class Metrics(BaseModel):
    rmse: float | None = None
    mae: float | None = None
    mape: float | None = Field(None, description="Mean Absolute Percentage Error (0-1 arası)")
    volatility_daily: float | None = None
    volatility_annualized: float | None = None
    volatility_annualization_days: int | None = None
    holdout_points: int | None = None
    mean_bias: float | None = Field(
        None,
        description="Ortalama (tahmin - gerçek); pozitif ise model genelde yukarı sapmıştır.",
    )
    regime: RegimeLabel | None = None
    walk_forward_rmse: float | None = None
    conformal_half_width: float | None = None


class ForecastResponse(BaseModel):
    symbol: str
    asset_class: str
    history: list[SeriesPoint]
    forecast: list[SeriesPoint]
    backtest_metrics: Metrics
    train_until_used: str | None = None
    holdout_actual: list[SeriesPoint] | None = None
    holdout_predicted: list[SeriesPoint] | None = None


class BacktestRequest(BaseModel):
    symbol: str = Field(..., min_length=1)
    history_days: int = Field(default=365, ge=30, le=3650)
    test_fraction: float = Field(default=0.2, gt=0.05, lt=0.5)
    asset_class: AssetClassParam = Field(default="auto")
    train_until: str | None = Field(default=None, description="YYYY-MM-DD kesit modu (forecast ile aynı)")
    data_start: str | None = Field(default=None)


class BacktestResponse(BaseModel):
    symbol: str
    asset_class: str
    metrics: Metrics
    test_actual: list[SeriesPoint]
    test_predicted: list[SeriesPoint]


class CompareRequest(BaseModel):
    symbols: list[str] = Field(..., min_length=1, max_length=10)
    history_days: int = Field(default=365, ge=30, le=3650)


class SymbolCompareStats(BaseModel):
    symbol: str
    return_30d: float | None = None
    vol_annual: float | None = None


class CompareResponse(BaseModel):
    symbols: list[SymbolCompareStats]
    correlation_labels: list[str]
    correlation: list[list[float | None]]


class QualityResponse(BaseModel):
    symbol: str
    missing_days: int
    outliers: list[str]
    jump_days: list[str]


class MarketEventOut(BaseModel):
    date: str
    title: str
    category: str
    symbols: list[str]


class EventsListResponse(BaseModel):
    events: list[MarketEventOut]


EventImpactDirection = Literal["up", "down", "neutral"]


class EventImpactRequest(BaseModel):
    symbol: str = Field(..., min_length=1)
    event_date: str = Field(..., description="YYYY-MM-DD")
    category: str = Field(..., min_length=1)
    event_title: str | None = None
    window_days: int = Field(default=5, ge=1, le=21)


class EventImpactResponse(BaseModel):
    symbol: str
    event_date: str
    category: str
    event_title: str | None = None
    window_days: int
    historical_samples: int
    avg_event_return_pct: float | None = None
    median_event_return_pct: float | None = None
    model_forecast_return_pct: float | None = None
    direction: EventImpactDirection
    direction_label: str
    summary: str
    similar_events: list[str] = Field(default_factory=list)


class GridBacktestRequest(BaseModel):
    symbol: str = Field(..., min_length=1)
    history_days: int = Field(default=365, ge=90, le=3650)
    asset_class: AssetClassParam = Field(default="auto")
    train_windows: list[int] = Field(default=[120, 180, 252])
    test_horizons: list[int] = Field(default=[14, 21, 30])


class GridBacktestCell(BaseModel):
    train_window: int
    test_horizon: int
    walk_forward_rmse: float | None
    folds: int


class GridBacktestResponse(BaseModel):
    symbol: str
    asset_class: str
    results: list[GridBacktestCell]


class FeedbackRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    message: str | None = Field(default=None, max_length=2000)
    symbol: str | None = None
    endpoint: str | None = None


class FeedbackResponse(BaseModel):
    id: str
    received_at: str


class WebhookCreateRequest(BaseModel):
    url: HttpUrl
    events: list[str] = Field(default_factory=lambda: ["forecast", "backtest"])


class WebhookOut(BaseModel):
    id: str
    url: str
    events: list[str]
    created_at: str


class WebhookListResponse(BaseModel):
    webhooks: list[WebhookOut]


class SystemLogEntry(BaseModel):
    trace_id: str
    method: str
    path: str
    status: int
    latency_ms: float
    timestamp: str


class SystemLogsResponse(BaseModel):
    logs: list[SystemLogEntry]


class QuotaResponse(BaseModel):
    symbol: str
    used: int
    limit: int


class MarketItem(BaseModel):
    symbol: str
    name: str
    price: float
    change_pct: float


class MarketSummaryResponse(BaseModel):
    items: list[MarketItem]


class SymbolSearchItem(BaseModel):
    symbol: str
    name: str
    exchange: str | None = None
    quote_type: str | None = None
    source: str = "yahoo"


class SymbolSearchResponse(BaseModel):
    symbols: list[str]
    results: list[SymbolSearchItem]


class HealthResponse(BaseModel):
    status: str

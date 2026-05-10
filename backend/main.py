from __future__ import annotations

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from data_service import fetch_history
from prophet_service import backtest_split, fit_and_forecast
from schemas import (
    BacktestRequest,
    BacktestResponse,
    ForecastRequest,
    ForecastResponse,
    HealthResponse,
    Metrics,
    SeriesPoint,
)

app = FastAPI(title="FinanceScout API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


STATIC_SYMBOL_SUGGESTIONS = [
    "BTC-USD",
    "ETH-USD",
    "EURUSD=X",
    "USDTRY=X",
    "GC=F",
    "THYAO.IS",
    "^GSPC",
    "AAPL",
]


@app.get("/symbols/search")
def symbols_search(q: str = Query("", min_length=0, max_length=32)) -> dict:
    q_up = q.strip().upper()
    if not q_up:
        return {"symbols": STATIC_SYMBOL_SUGGESTIONS}
    hits = [s for s in STATIC_SYMBOL_SUGGESTIONS if q_up in s]
    return {"symbols": hits[:20]}


def _row_to_point_forecast(row) -> SeriesPoint:
    return SeriesPoint(
        ds=row["ds"].strftime("%Y-%m-%d"),
        y=None,
        yhat=float(row["yhat"]),
        yhat_lower=float(row["yhat_lower"]),
        yhat_upper=float(row["yhat_upper"]),
    )


@app.post("/forecast", response_model=ForecastResponse)
def forecast(body: ForecastRequest) -> ForecastResponse:
    try:
        hist = fetch_history(body.symbol, body.history_days)
        hist_fc, fut_fc = fit_and_forecast(hist, body.forecast_days)
        mdict, _, _ = backtest_split(hist, test_fraction=0.2)

        history_points: list[SeriesPoint] = []
        for _, row in hist.iterrows():
            ds = row["ds"]
            match = hist_fc[hist_fc["ds"].dt.normalize() == ds.normalize()]
            if not match.empty:
                r = match.iloc[0]
                history_points.append(
                    SeriesPoint(
                        ds=ds.strftime("%Y-%m-%d"),
                        y=float(row["y"]),
                        yhat=float(r["yhat"]),
                        yhat_lower=float(r["yhat_lower"]),
                        yhat_upper=float(r["yhat_upper"]),
                    )
                )
            else:
                history_points.append(
                    SeriesPoint(ds=ds.strftime("%Y-%m-%d"), y=float(row["y"]))
                )

        forecast_points = [_row_to_point_forecast(row) for _, row in fut_fc.iterrows()]

        metrics = Metrics(
            rmse=mdict.get("rmse"),
            mae=mdict.get("mae"),
            volatility_daily=mdict.get("volatility_daily"),
            volatility_annualized=mdict.get("volatility_annualized"),
        )

        return ForecastResponse(
            symbol=body.symbol.strip().upper(),
            history=history_points,
            forecast=forecast_points,
            backtest_metrics=metrics,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Upstream or model error: {e!s}") from e


@app.post("/backtest", response_model=BacktestResponse)
def backtest(body: BacktestRequest) -> BacktestResponse:
    try:
        hist = fetch_history(body.symbol, body.history_days)
        mdict, actual_df, pred_df = backtest_split(hist, body.test_fraction)

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

        metrics = Metrics(
            rmse=mdict.get("rmse"),
            mae=mdict.get("mae"),
            volatility_daily=mdict.get("volatility_daily"),
            volatility_annualized=mdict.get("volatility_annualized"),
        )

        return BacktestResponse(
            symbol=body.symbol.strip().upper(),
            metrics=metrics,
            test_actual=test_actual,
            test_predicted=test_predicted,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Upstream or model error: {e!s}") from e

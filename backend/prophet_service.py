from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from prophet import Prophet
from sklearn.metrics import mean_absolute_error, mean_squared_error

from data_service import daily_returns_volatility


def _prophet_ready(df: pd.DataFrame) -> pd.DataFrame:
    p = df.copy()
    p = p.dropna(subset=["y"])
    p["ds"] = pd.to_datetime(p["ds"]).dt.tz_localize(None)
    return p.reset_index(drop=True)


def fit_and_forecast(history: pd.DataFrame, forecast_days: int) -> tuple[pd.DataFrame, pd.DataFrame]:
    train = _prophet_ready(history)
    if len(train) < 14:
        raise ValueError("Need at least 14 historical rows after cleaning for Prophet.")

    m = Prophet(daily_seasonality=True, weekly_seasonality=True, yearly_seasonality=len(train) > 180)
    m.fit(train[["ds", "y"]])

    future = m.make_future_dataframe(periods=forecast_days, freq="D")
    fc = m.predict(future)

    hist_ds = set(train["ds"].dt.normalize())

    hist_part = fc[fc["ds"].dt.normalize().isin(hist_ds)].copy()
    fut_part = fc[~fc["ds"].dt.normalize().isin(hist_ds)].copy()
    fut_part = fut_part.head(forecast_days)
    return hist_part, fut_part


def backtest_split(history: pd.DataFrame, test_fraction: float) -> tuple[dict[str, Any], pd.DataFrame, pd.DataFrame]:
    df = _prophet_ready(history)
    n = len(df)
    if n < 30:
        raise ValueError("Need at least 30 rows for backtesting.")

    split = int(n * (1.0 - test_fraction))
    split = max(split, 14)
    if n - split < 5:
        split = n - 5

    train = df.iloc[:split].copy()
    test = df.iloc[split:].copy()

    m = Prophet(daily_seasonality=True, weekly_seasonality=True, yearly_seasonality=len(train) > 180)
    m.fit(train[["ds", "y"]])

    periods = len(test)
    future = m.make_future_dataframe(periods=periods, freq="D")
    fc = m.predict(future)

    merged = pd.merge(
        test[["ds", "y"]],
        fc[["ds", "yhat", "yhat_lower", "yhat_upper"]],
        on="ds",
        how="inner",
    )

    if len(merged) < 3:
        raise ValueError("Too few overlapping calendar dates between model output and test window.")

    y_true = merged["y"].astype(float).values
    y_hat = merged["yhat"].astype(float).values

    rmse = float(np.sqrt(mean_squared_error(y_true, y_hat)))
    mae = float(mean_absolute_error(y_true, y_hat))

    vol_d, vol_a = daily_returns_volatility(df["y"])

    metrics = {
        "rmse": rmse,
        "mae": mae,
        "volatility_daily": vol_d,
        "volatility_annualized": vol_a,
    }

    actual_df = merged[["ds", "y"]].copy()
    pred_df = merged[["ds", "yhat", "yhat_lower", "yhat_upper"]].copy()
    return metrics, actual_df, pred_df

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from prophet import Prophet
from sklearn.metrics import mean_absolute_error, mean_squared_error

from data_service import daily_returns_volatility
from events import fomc_holiday_dates
from lstm_service import blend_with_prophet
from model_profiles import ProphetModelProfile, get_profile
from sentiment_service import sentiment_for_training


# ---------------------------------------------------------------------------
# Tasarım: Prophet birincil tahminci. AI bileşeni olarak iteratif bir LSTM
# yerine son 21 günün EWMA log-return'üne dayanan **monoton momentum patikası**
# kullanılıyor — bu inşası gereği zig-zag üretemez ve Prophet ile
# harmanlandığında grafikteki sebepsiz dipsel-tepe paternlerini yok eder.
# ---------------------------------------------------------------------------


_MOMENTUM_LOOKBACK = 21    # son 21 günün log-return'ü
_MOMENTUM_HALFLIFE = 7.0   # EWMA yarı-ömrü (gün)
_MOMENTUM_BLEND_DAYS = 14  # ilk 14 günde Prophet ile karıştır
_MOMENTUM_BLEND_WEIGHT = 0.15  # başlangıç ağırlığı (gün 0)
_MOMENTUM_DRIFT_CAP = 0.005    # günlük drift |%0.5| ile sınırlandırılır

# Fiyatın eğitim volatilitesinin kaç katına kadar sapmasına izin verildiği:
# exp(±SIGMA_CAP·σ_d·√t) bandının dışına çıkan herhangi bir yhat kırpılır.
_FORECAST_SIGMA_CAP = 3.0   # 3.5 → 3.0 (daha sıkı kafes)
# Sezgisel taban volatilite sınırları.
_MIN_DAILY_SIGMA = 0.004   # %0.4
_MAX_DAILY_SIGMA = 0.05    # %5

# Tahmin patikasına uygulanan yumuşatma penceresi (Hann ağırlıklı).
_FUTURE_SMOOTH_WINDOW = 5

# Trend dampening: Prophet'in trendinin son train değerinden ne kadar
# uzaklaşacağı `halflife` günlük yarı-ömürle azaltılır. Kısa ufukta etkisi
# minimal, uzun ufukta (>30 gün) overshoot'u keser.
# Halflife=90 gün → 9 günde decay≈0.93 (neredeyse hiç dokunmaz),
# 30 günde 0.79, 73 günde 0.57, 90 günde 0.5.
_TREND_DAMP_HALFLIFE = 90.0


def _ewma_drift(train_y: np.ndarray) -> float:
    """Son `_MOMENTUM_LOOKBACK` günün exponensiyel ağırlıklı ortalama log-return'ü.

    Sonuç fiyatın günlük beklenen "drift"idir; ±`_MOMENTUM_DRIFT_CAP` aralığına
    kırpılarak uç değerler bastırılır.
    """
    y = np.asarray(train_y, dtype=float)
    if len(y) < 5 or (y <= 0).any():
        return 0.0
    log_ret = np.diff(np.log(y))
    if len(log_ret) == 0:
        return 0.0

    n = min(len(log_ret), _MOMENTUM_LOOKBACK)
    recent = log_ret[-n:]

    # EWMA: yarı-ömre göre üstel azalan ağırlıklar (en son gün en ağır).
    ages = np.arange(n - 1, -1, -1, dtype=float)
    decay = np.exp(-np.log(2) * ages / _MOMENTUM_HALFLIFE)
    w = decay / decay.sum()
    drift = float(np.sum(recent * w))

    if not np.isfinite(drift):
        return 0.0
    return float(np.clip(drift, -_MOMENTUM_DRIFT_CAP, _MOMENTUM_DRIFT_CAP))


def _momentum_path(train_y: np.ndarray, periods: int) -> np.ndarray:
    """Inşası gereği monoton fiyat patikası: P_t = P_0 · exp(drift · t).

    Bu patika asla iç içe geçmiş tepe-dip dalgalanması üretemez; Prophet'in
    weekly seasonality'sinin neden olabileceği zigzag'ı hafifletmek için
    Prophet ile harmanlanır.
    """
    if periods <= 0 or len(train_y) == 0:
        return np.zeros(max(periods, 0), dtype=float)

    drift = _ewma_drift(train_y)
    last = float(train_y[-1])
    if not np.isfinite(last) or last <= 0:
        return np.full(periods, last, dtype=float)

    t = np.arange(1, periods + 1, dtype=float)
    return last * np.exp(drift * t)


# ---------------------------------------------------------------------------
# Prophet wrapper'ları
# ---------------------------------------------------------------------------


def _prophet_ready(df: pd.DataFrame) -> pd.DataFrame:
    p = df.copy()
    p = p.dropna(subset=["y"])
    p["ds"] = pd.to_datetime(p["ds"]).dt.tz_localize(None)
    p = p.sort_values("ds").drop_duplicates(subset=["ds"], keep="last")
    p["y_orig"] = p["y"].astype(float)
    return p.reset_index(drop=True)


def _build_prophet(train_rows: int, profile: ProphetModelProfile) -> Prophet:
    weekly = profile.asset_class == "stock"
    holidays = _fomc_holidays_df()
    return Prophet(
        daily_seasonality=False,
        weekly_seasonality=weekly,
        yearly_seasonality=(train_rows > 180),
        changepoint_prior_scale=profile.changepoint_prior_scale,
        seasonality_prior_scale=3.0,
        seasonality_mode="additive",
        changepoint_range=0.85,
        interval_width=0.8,
        holidays=holidays if len(holidays) > 0 else None,
    )


def _blend_future_with_momentum(
    prophet_yhat: np.ndarray,
    train_y: np.ndarray,
) -> np.ndarray:
    """Prophet'in geleceğini, monoton momentum patikası ile harmanlar.

    Bu blend zig-zag üretemez: momentum patikası tek bir drift ile kuruluyor
    (üstel monoton), Prophet de genellikle düzgün bir trend. İkisinin doğrusal
    karışımı da düzgündür. `prophet_yhat` sadece *gelecek* noktalardır.
    """
    prophet_yhat = np.array(prophet_yhat, dtype=float, copy=True)
    n_future = len(prophet_yhat)
    if n_future == 0:
        return prophet_yhat

    momentum = _momentum_path(np.asarray(train_y, dtype=float), n_future)
    momentum = np.array(momentum, dtype=float, copy=True)
    if len(momentum) != n_future:
        return prophet_yhat

    # Momentum patikasını Prophet'in başlangıç noktasıyla eşitle (eklem yok).
    if abs(prophet_yhat[0]) > 1e-9:
        bias = momentum[0] - prophet_yhat[0]
        momentum = momentum - bias

    weights = np.zeros(n_future, dtype=float)
    horizon = min(_MOMENTUM_BLEND_DAYS, n_future)
    weights[:horizon] = np.linspace(_MOMENTUM_BLEND_WEIGHT, 0.0, num=horizon)

    return (1.0 - weights) * prophet_yhat + weights * momentum


def _smooth_tail(values: np.ndarray, window: int = _FUTURE_SMOOTH_WINDOW) -> np.ndarray:
    """Geleceğin tamamına Hann ağırlıklı ortalama uygular; başlangıç sabit kalır.

    Hann penceresi ortadaki noktalara daha yüksek ağırlık verir, böylece
    haftalık sezonsallık veya başka kaynaklardan gelen küçük zigzag'ları
    mekanik olarak yutar. Pencere kenarlarında yansıtmalı doldurma kullanılır.
    """
    arr = np.array(values, dtype=float, copy=True)
    n = len(arr)
    if n == 0 or window <= 1:
        return arr
    w = min(window, max(3, n))
    # Tek sayılı pencere garantisi (merkezleme için).
    if w % 2 == 0:
        w -= 1
    if w < 3:
        return arr

    half = w // 2
    # Yansıtmalı (reflect) padding — sınırlarda bias oluşmasın.
    padded = np.pad(arr, pad_width=half, mode="reflect")
    kernel = np.hanning(w)
    kernel = kernel / kernel.sum()
    smoothed = np.convolve(padded, kernel, mode="valid")
    smoothed = np.array(smoothed[:n], dtype=float, copy=True)

    # İlk eleman: Prophet'in son noktasından başlayan eğri kaymasın.
    smoothed[0] = arr[0]
    return smoothed


def _residual_band(
    train_y: np.ndarray,
    yhat_train: np.ndarray,
    n_future: int,
    profile: ProphetModelProfile,
) -> tuple[np.ndarray, np.ndarray]:
    """Eğitim üzerindeki residual std'sinden, ufka göre genişleyen güven bandı."""
    if len(train_y) == 0 or len(yhat_train) == 0:
        return np.zeros(n_future), np.zeros(n_future)
    n = min(len(train_y), len(yhat_train))
    residuals = train_y[-n:] - yhat_train[-n:]
    sigma = float(np.std(residuals, ddof=1)) if n > 1 else float(np.std(residuals))
    if not np.isfinite(sigma) or sigma <= 0:
        sigma = float(np.std(train_y) * 0.05) if len(train_y) > 1 else 0.0

    # Bantlar fiyatın ~%20'sini geçmesin; aksi halde grafik uçlarda dipe iner.
    last_price = float(train_y[-1]) if len(train_y) else 0.0
    sigma_cap = max(abs(last_price) * 0.10, 1e-9)
    sigma = min(sigma, sigma_cap)

    # Belirsizliğin zamanla artmasını taklit et: σ * sqrt(t/τ); kripto için
    # daha hızlı genişleme.
    tau = 30.0 if profile.asset_class != "crypto" else 14.0
    t = np.arange(1, n_future + 1, dtype=float)
    growth = np.sqrt(np.minimum(t / tau, 4.0))
    z = 1.28  # ~%80 güven bandı
    half_width = z * sigma * np.maximum(growth, 0.5)
    return half_width, half_width


def _daily_sigma_estimate(train_y: np.ndarray) -> float:
    """Eğitim verisinin günlük log-return std'si; mantıklı bir aralığa kırpılır."""
    if len(train_y) < 2:
        return _MIN_DAILY_SIGMA
    y = np.asarray(train_y, dtype=float)
    if (y <= 0).any():
        return _MIN_DAILY_SIGMA
    log_ret = np.diff(np.log(y))
    if len(log_ret) == 0:
        return _MIN_DAILY_SIGMA
    sig = float(np.std(log_ret, ddof=1)) if len(log_ret) > 1 else float(np.std(log_ret))
    if not np.isfinite(sig) or sig <= 0:
        sig = _MIN_DAILY_SIGMA
    return float(np.clip(sig, _MIN_DAILY_SIGMA, _MAX_DAILY_SIGMA))


def _clamp_future_path(
    yhat_future: np.ndarray,
    last_price: float,
    daily_sigma: float,
) -> np.ndarray:
    """Tahmini fiyatı ±SIGMA_CAP·σ·√t bandına kırp, NaN/Inf'i son değere çek."""
    out = np.array(yhat_future, dtype=float, copy=True)
    if len(out) == 0 or not np.isfinite(last_price) or last_price <= 0:
        return out

    t = np.arange(1, len(out) + 1, dtype=float)
    width = _FORECAST_SIGMA_CAP * daily_sigma * np.sqrt(t)
    upper = last_price * np.exp(width)
    lower = last_price * np.exp(-width)

    # NaN/Inf'i bir önceki geçerli değerle ya da last_price ile doldur.
    if not np.all(np.isfinite(out)):
        last_good = last_price
        for i in range(len(out)):
            if not np.isfinite(out[i]):
                out[i] = last_good
            else:
                last_good = out[i]

    return np.clip(out, lower, upper)


# ---------------------------------------------------------------------------
# Genel akış: ya Prophet'in fit'ini history için kullanırız, ya da
# `cutoff_train_forecast` ile holdout/canlı tahmin üretiriz.
# ---------------------------------------------------------------------------


def _fomc_holidays_df() -> pd.DataFrame:
    rows = []
    for ds in fomc_holiday_dates():
        rows.append({"holiday": "fomc", "ds": pd.Timestamp(ds), "lower_window": 0, "upper_window": 1})
    return pd.DataFrame(rows)


def _run_prophet(
    train: pd.DataFrame,
    horizon_days: int,
    profile: ProphetModelProfile,
    sentiment: pd.Series | None = None,
) -> pd.DataFrame:
    """Prophet'i **raw-domain**'de additive seasonality ile eğitir."""
    df = train[["ds", "y"]].copy()
    df = df.dropna(subset=["y"])

    if len(df) == 0:
        raise ValueError("Eğitim için fiyat değeri yok.")

    m = _build_prophet(len(df), profile)

    reg = sentiment
    if reg is None:
        reg = sentiment_for_training(df["ds"])
    if reg is not None and len(reg) == len(df):
        df = df.copy()
        df["event_intensity"] = reg.to_numpy(dtype=float)
        m.add_regressor("event_intensity", standardize=True)

    fit_cols = ["ds", "y"]
    if "event_intensity" in df.columns:
        fit_cols.append("event_intensity")
    m.fit(df[fit_cols])
    future_df = m.make_future_dataframe(periods=int(horizon_days), freq="D")
    if "event_intensity" in df.columns:
        future_df["event_intensity"] = 0.0
        hist_map = df.set_index("ds")["event_intensity"]
        future_df.loc[future_df["ds"].isin(hist_map.index), "event_intensity"] = future_df.loc[
            future_df["ds"].isin(hist_map.index), "ds"
        ].map(hist_map)
    fc = m.predict(future_df).reset_index(drop=True)

    return fc[["ds", "yhat", "yhat_lower", "yhat_upper"]].copy()


def conformal_bands(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    alpha: float = 0.2,
) -> tuple[np.ndarray, np.ndarray]:
    """Symmetric conformal residual bands around predictions."""
    residuals = np.abs(np.asarray(y_true, dtype=float) - np.asarray(y_pred, dtype=float))
    if len(residuals) == 0:
        return np.zeros_like(y_pred), np.zeros_like(y_pred)
    q = float(np.quantile(residuals, 1.0 - alpha))
    y_pred = np.asarray(y_pred, dtype=float)
    return y_pred - q, y_pred + q


def detect_regime(history: pd.DataFrame, lookback: int = 60) -> str:
    """Classify recent volatility vs longer sample median."""
    df = _prophet_ready(history)
    y = df["y"].astype(float)
    if len(y) < lookback + 20:
        return "low_vol"
    long_vol, _ = daily_returns_volatility(y, annualization=252)
    short_vol, _ = daily_returns_volatility(y.tail(lookback), annualization=252)
    if not np.isfinite(long_vol) or not np.isfinite(short_vol) or long_vol <= 0:
        return "low_vol"
    return "high_vol" if short_vol > long_vol * 1.25 else "low_vol"


def walk_forward_backtest(
    history: pd.DataFrame,
    profile: ProphetModelProfile,
    train_window: int = 180,
    test_horizon: int = 21,
    step: int = 21,
) -> dict[str, Any]:
    """Rolling walk-forward RMSE over fixed train/test windows."""
    df = _prophet_ready(history)
    n = len(df)
    if n < train_window + test_horizon + 14:
        return {"walk_forward_rmse": None, "folds": 0}

    rmses: list[float] = []
    start = train_window
    while start + test_horizon <= n:
        train = df.iloc[start - train_window : start].copy()
        test = df.iloc[start : start + test_horizon].copy()
        fc = _run_prophet(train[["ds", "y"]], test_horizon + 7, profile)
        fc = _assemble_forecast(train[["ds", "y"]], fc, profile)
        merged = pd.merge(
            test[["ds", "y"]],
            fc[["ds", "yhat"]].drop_duplicates("ds"),
            on="ds",
            how="inner",
        )
        if len(merged) >= 3:
            err = merged["y"].to_numpy(dtype=float) - merged["yhat"].to_numpy(dtype=float)
            rmses.append(float(np.sqrt(np.mean(err**2))))
        start += step

    if not rmses:
        return {"walk_forward_rmse": None, "folds": 0}

    return {"walk_forward_rmse": float(np.mean(rmses)), "folds": len(rmses)}


def _anchor_to_last_price(
    yhat_future: np.ndarray,
    last_price: float,
) -> np.ndarray:
    """Tüm gelecek tahminlerine sabit multiplicative offset uygular: Prophet'in
    1. gün tahmini ile gerçek son fiyat arasındaki oranı bul, tüm geleceğe
    aynı oranı uygula.

    Önceki sürümde `fade` ile 5 gün sonra Prophet'in level'ına geri dönüyorduk
    — bu "53 → 50 → tekrar Prophet seviyesi" gibi kırılmalar yaratıyordu.
    Sabit ölçek hem grafikte düzgün, hem de level offset hatasını sürekli
    olarak siliyor.
    """
    arr = np.array(yhat_future, dtype=float, copy=True)
    n = len(arr)
    if n == 0 or last_price <= 0 or not np.isfinite(last_price):
        return arr
    if abs(arr[0]) < 1e-9:
        return arr

    ratio0 = last_price / arr[0]
    if not np.isfinite(ratio0) or ratio0 <= 0:
        return arr
    # Aşırı dengesiz Prophet çıktısına karşı ratio'yu bandla.
    ratio0 = float(np.clip(ratio0, 0.85, 1.15))
    return arr * ratio0


def _dampen_trend(
    yhat_future: np.ndarray,
    last_price: float,
    halflife: float = _TREND_DAMP_HALFLIFE,
) -> np.ndarray:
    """Prophet'in trendini exponansiyel olarak azaltarak uzun ufukta
    overshoot'u engeller.

    `last_price`'a göre fark `factor = exp(-ln2 · t / halflife)` ile dampene
    edilir. t<<halflife için neredeyse hiç değişmez; t≈halflife için fark
    yarıya iner. Backtest'te 73 günlük ufukta exponansiyel patlamayı keser.
    """
    arr = np.array(yhat_future, dtype=float, copy=True)
    n = len(arr)
    if n == 0 or last_price <= 0 or halflife <= 0:
        return arr

    t = np.arange(1, n + 1, dtype=float)
    decay = np.exp(-np.log(2) * t / halflife)
    # arr - last_price → ne kadar uzaklaştığı; decay ile sıkıştır.
    return last_price + (arr - last_price) * decay


def _assemble_forecast(
    train: pd.DataFrame,
    fc: pd.DataFrame,
    profile: ProphetModelProfile,
) -> pd.DataFrame:
    """Anchor + momentum harmanı + tail smoothing + bandlanmış güven aralığı.

    `fc` Prophet'in tüm satırlarını (geçmiş fit + gelecek) içerir; biz sadece
    eğitim sonrasındaki bölümü değiştiririz.
    """
    last_train_date = pd.Timestamp(train["ds"].max())
    train_y = np.array(train["y"].to_numpy(), dtype=float, copy=True)

    fc = fc.copy()
    fc["ds"] = pd.to_datetime(fc["ds"]).dt.tz_localize(None)

    is_future = fc["ds"] > last_train_date
    yhat_future = np.array(fc.loc[is_future, "yhat"].to_numpy(), dtype=float, copy=True)

    if len(yhat_future) > 0:
        last_price = float(train_y[-1]) if len(train_y) else 0.0

        # 1) Anchor: Prophet'in 1. gün level offset'ini sil (sabit ölçek).
        anchored = _anchor_to_last_price(yhat_future, last_price)

        # 2) Trend dampening: uzun ufukta exponansiyel patlamayı kes.
        damped = _dampen_trend(anchored, last_price, halflife=_TREND_DAMP_HALFLIFE)

        # 3) Momentum patikası ile harmanla (monoton drift, smooth).
        blended = _blend_future_with_momentum(
            prophet_yhat=damped,
            train_y=train_y,
        )

        # 4) Hafif Hann yumuşatma.
        blended = _smooth_tail(blended)

        # 5) Fiziksel volatilite kafesi.
        daily_sigma = _daily_sigma_estimate(train_y)
        blended = _clamp_future_path(blended, last_price, daily_sigma)

        fc.loc[is_future, "yhat"] = blended

        # Residual tabanlı güven bandı (Prophet'in kendi yhat_lower/upper'ı
        # log-domain'den geri dönüşte asimetrik hale gelir; biz volatiliteden
        # türetilmiş simetrik bir bandla yer değiştiriyoruz, daha kararlı).
        yhat_train = np.array(
            fc.loc[~is_future, "yhat"].to_numpy(), dtype=float, copy=True
        )
        lower_w, upper_w = _residual_band(train_y, yhat_train, len(blended), profile)
        t = np.arange(1, len(blended) + 1, dtype=float)
        vol_band = blended * (np.exp(daily_sigma * np.sqrt(t) * 1.28) - 1.0)
        half_width = np.minimum(np.maximum(lower_w, 0.0), np.abs(vol_band))

        fc.loc[is_future, "yhat_lower"] = np.maximum(blended - half_width, 0.0)
        fc.loc[is_future, "yhat_upper"] = blended + half_width

    return fc


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def cutoff_train_forecast(
    full: pd.DataFrame,
    train_until: pd.Timestamp,
    forecast_days: int,
    profile: ProphetModelProfile,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, dict[str, Any]]:
    df = _prophet_ready(full)

    train_until = pd.Timestamp(train_until).normalize().tz_localize(None)
    train = df[df["ds"] <= train_until].copy().reset_index(drop=True)
    holdout = df[df["ds"] > train_until].copy().reset_index(drop=True)

    if len(train) < 14:
        raise ValueError("Eğitim için yeterli veri yok.")

    last_actual = df["ds"].max()
    last_train = train["ds"].max()
    horizon_days = int((last_actual - last_train).days) + int(forecast_days) + 7

    regime = detect_regime(df)
    fc = _run_prophet(train[["ds", "y"]], horizon_days, profile)
    fc = _assemble_forecast(train[["ds", "y"]], fc, profile)

    fc_final = fc[["ds", "yhat", "yhat_lower", "yhat_upper"]].drop_duplicates(subset=["ds"])
    orig_subset = df[["ds", "y_orig"]].drop_duplicates(subset=["ds"])
    fc_final = pd.merge(fc_final, orig_subset, on="ds", how="left")
    fc_final = fc_final.rename(columns={"y_orig": "y"})

    merged_holdout = pd.merge(
        holdout[["ds", "y_orig"]].rename(columns={"y_orig": "y"}).drop_duplicates(subset=["ds"]),
        fc_final[["ds", "yhat", "yhat_lower", "yhat_upper"]],
        on="ds",
        how="inner",
    )

    vol_d, vol_a = daily_returns_volatility(df["y_orig"], annualization=profile.volatility_annualization)
    wf = walk_forward_backtest(df[["ds", "y_orig"]].rename(columns={"y_orig": "y"}), profile)
    metrics: dict[str, Any] = {
        "volatility_daily": vol_d,
        "volatility_annualized": vol_a,
        "volatility_annualization_days": profile.volatility_annualization,
        "holdout_points": len(merged_holdout),
        "regime": regime,
        "walk_forward_rmse": wf.get("walk_forward_rmse"),
    }

    if len(merged_holdout) >= 3:
        y_true = merged_holdout["y"].to_numpy(dtype=float)
        y_pred = merged_holdout["yhat"].to_numpy(dtype=float)
        metrics["rmse"] = float(np.sqrt(mean_squared_error(y_true, y_pred)))
        metrics["mae"] = float(mean_absolute_error(y_true, y_pred))
        metrics["mean_actual"] = float(np.mean(y_true))
        metrics["mean_bias"] = float(np.mean(y_pred - y_true))
        lower_c, upper_c = conformal_bands(y_true, y_pred)
        metrics["conformal_half_width"] = float(np.mean(upper_c - y_pred))

    future_tail = fc_final[fc_final["ds"] > last_actual].head(int(forecast_days)).copy()
    return fc_final, future_tail, merged_holdout, metrics


def fit_and_forecast(
    history: pd.DataFrame,
    forecast_days: int,
    profile: ProphetModelProfile | None = None,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    prof = profile or get_profile("stock")
    df = _prophet_ready(history)
    if len(df) < 14:
        raise ValueError("Yetersiz veri.")

    fc = _run_prophet(df[["ds", "y"]], int(forecast_days), prof)
    fc = _assemble_forecast(df[["ds", "y"]], fc, prof)

    train_y = df["y"].to_numpy(dtype=float)
    is_future = fc["ds"] > df["ds"].max()
    if is_future.any():
        fut_yhat = fc.loc[is_future, "yhat"].to_numpy(dtype=float)
        blended = blend_with_prophet(fut_yhat, train_y, len(fut_yhat), prophet_rmse=None)
        if blended is not None:
            fc.loc[is_future, "yhat"] = blended

    fc = pd.merge(fc, df[["ds", "y_orig"]], on="ds", how="left")
    fc = fc.rename(columns={"y_orig": "y"})

    hist_part = fc[fc["y"].notnull()].copy()
    fut_part = fc[fc["y"].isnull()].head(int(forecast_days)).copy()
    return hist_part, fut_part


def backtest_split(
    history: pd.DataFrame,
    test_fraction: float,
    profile: ProphetModelProfile | None = None,
) -> tuple[dict[str, Any], pd.DataFrame, pd.DataFrame]:
    prof = profile or get_profile("stock")
    df = _prophet_ready(history)
    n = len(df)
    split = max(int(n * (1.0 - test_fraction)), 14)

    train = df.iloc[:split].copy().reset_index(drop=True)
    test = df.iloc[split:].copy().reset_index(drop=True)

    horizon = len(test) + 7
    fc = _run_prophet(train[["ds", "y"]], horizon, prof)
    fc = _assemble_forecast(train[["ds", "y"]], fc, prof)

    merged = pd.merge(
        test[["ds", "y"]].drop_duplicates("ds"),
        fc[["ds", "yhat", "yhat_lower", "yhat_upper"]].drop_duplicates("ds"),
        on="ds",
        how="inner",
    )

    y_true = merged["y"].to_numpy(dtype=float)
    y_pred = merged["yhat"].to_numpy(dtype=float)
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    
    with np.errstate(divide="ignore", invalid="ignore"):
        abs_pct_err = np.abs((y_true - y_pred) / y_true)
        mape = np.mean(abs_pct_err[np.isfinite(abs_pct_err)])

    vol_d, vol_a = daily_returns_volatility(df["y"], annualization=prof.volatility_annualization)
    wf = walk_forward_backtest(df[["ds", "y"]], prof)
    metrics = {
        "rmse": rmse,
        "mae": float(mean_absolute_error(y_true, y_pred)),
        "mape": float(mape) if np.isfinite(mape) else 0.0,
        "volatility_daily": vol_d,
        "volatility_annualized": vol_a,
        "volatility_annualization_days": prof.volatility_annualization,
        "regime": detect_regime(df),
        "walk_forward_rmse": wf.get("walk_forward_rmse"),
    }
    lower_c, upper_c = conformal_bands(y_true, y_pred)
    metrics["conformal_half_width"] = float(np.mean(upper_c - y_pred))

    return metrics, merged[["ds", "y"]], merged[["ds", "yhat", "yhat_lower", "yhat_upper"]]


from __future__ import annotations

import numpy as np

_TORCH_AVAILABLE = False
try:
    import torch
    import torch.nn as nn

    _TORCH_AVAILABLE = True
except ImportError:
    torch = None  # type: ignore[assignment]
    nn = None  # type: ignore[assignment]


class _TinyLSTM(nn.Module if _TORCH_AVAILABLE else object):  # type: ignore[misc]
    def __init__(self, hidden: int = 16) -> None:
        if not _TORCH_AVAILABLE:
            return
        super().__init__()
        self.lstm = nn.LSTM(input_size=1, hidden_size=hidden, batch_first=True)
        self.head = nn.Linear(hidden, 1)

    def forward(self, x):  # type: ignore[no-untyped-def]
        out, _ = self.lstm(x)
        return self.head(out[:, -1, :])


def lstm_forecast(train_y: np.ndarray, horizon: int) -> np.ndarray | None:
    """Tiny LSTM on last 60 log-returns; None if torch unavailable or data too short."""
    if not _TORCH_AVAILABLE or horizon <= 0:
        return None

    y = np.asarray(train_y, dtype=float)
    if len(y) < 65 or (y <= 0).any():
        return None

    log_ret = np.diff(np.log(y))
    window = min(60, len(log_ret))
    seq = log_ret[-window:].astype(np.float32)
    if len(seq) < 20:
        return None

    device = torch.device("cpu")
    model = _TinyLSTM().to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
    criterion = nn.MSELoss()

    x = torch.tensor(seq[:-1], dtype=torch.float32).view(1, -1, 1).to(device)
    target = torch.tensor(seq[1:], dtype=torch.float32).view(-1, 1).to(device)

    model.train()
    for _ in range(40):
        optimizer.zero_grad()
        pred = model(x)
        loss = criterion(pred.view(-1, 1), target[-1:])
        loss.backward()
        optimizer.step()

    model.eval()
    last_price = float(y[-1])
    preds: list[float] = []
    state_seq = seq.copy()

    with torch.no_grad():
        for _ in range(horizon):
            inp = torch.tensor(state_seq[-window:], dtype=torch.float32).view(1, -1, 1).to(device)
            nxt_ret = float(model(inp).item())
            nxt_ret = float(np.clip(nxt_ret, -0.1, 0.1))
            last_price = last_price * np.exp(nxt_ret)
            preds.append(last_price)
            state_seq = np.append(state_seq, nxt_ret)

    return np.array(preds, dtype=float)


def blend_with_prophet(
    prophet_yhat: np.ndarray,
    train_y: np.ndarray,
    horizon: int,
    prophet_rmse: float | None,
) -> np.ndarray | None:
    """Blend Prophet future path with LSTM when torch is available."""
    lstm_path = lstm_forecast(train_y, horizon)
    if lstm_path is None:
        return None

    prophet_yhat = np.asarray(prophet_yhat, dtype=float)
    if len(prophet_yhat) != len(lstm_path):
        return lstm_path

    rmse = prophet_rmse if prophet_rmse and prophet_rmse > 0 else 1.0
    lstm_err = float(np.std(np.diff(np.log(train_y[-30:])))) if len(train_y) > 30 else rmse
    w_lstm = float(np.clip(lstm_err / (rmse + lstm_err), 0.1, 0.45))
    return (1.0 - w_lstm) * prophet_yhat + w_lstm * lstm_path

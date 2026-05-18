from __future__ import annotations

from unittest.mock import patch

import pandas as pd
import pytest

from compare_service import compare_symbols


def _fake_history(symbol: str, history_days: int) -> pd.DataFrame:
    n = min(history_days, 120)
    ds = pd.date_range(end=pd.Timestamp.today().normalize(), periods=n, freq="B")
    base = 100.0 + hash(symbol) % 20
    y = [base + i * 0.1 for i in range(n)]
    return pd.DataFrame({"ds": ds, "y": y})


@patch("compare_service.fetch_history", side_effect=_fake_history)
def test_compare_symbols_structure(mock_fetch):
    result = compare_symbols(["AAPL", "MSFT"], history_days=90)
    assert len(result["symbols"]) == 2
    assert result["correlation_labels"] == ["AAPL", "MSFT"]
    assert len(result["correlation"]) == 2
    assert result["correlation"][0][0] == 1.0
    mock_fetch.assert_called()

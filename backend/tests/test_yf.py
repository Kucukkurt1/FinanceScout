import yfinance as yf
import pandas as pd

symbols = ["BTC-USD", "USDTRY=X", "GC=F", "^GSPC", "THYAO.IS"]
results = []
for sym in symbols:
    print(f"Fetching {sym}...")
    try:
        ticker = yf.Ticker(sym)
        df = ticker.history(period="5d")
        print(f"DF shape: {df.shape}")
        if df.empty or len(df) < 2:
            print(f"Skipping {sym} because DF is empty or too short.")
            continue

        last_two = df["Close"].tail(2)
        current_price = float(last_two.iloc[-1])
        prev_price = float(last_two.iloc[-2])
        change_pct = ((current_price - prev_price) / prev_price) * 100

        results.append(
            {
                "symbol": sym,
                "price": current_price,
                "change_pct": change_pct,
                "name": sym,
            }
        )
        print(f"Success for {sym}: {current_price}")
    except Exception as e:
        print(f"Error for {sym}: {e}")

print("\nFinal Results:")
print(results)

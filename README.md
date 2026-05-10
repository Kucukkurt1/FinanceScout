# FinanceScout (Hackathon MVP)

AI destekli basit **backtesting** ve **kısa ufuk fiyat tahmini** için monorepo: FastAPI + Prophet + yfinance arka ucu ve Next.js (App Router) + Tailwind + shadcn/ui + Recharts ön yüzü.

## Örnek Yahoo Finance sembolleri

- **Kripto:** `BTC-USD`, `ETH-USD`
- **Döviz:** `EURUSD=X`, `USDTRY=X`
- **Hisse (örnek):** `THYAO.IS`, `AAPL`
- **Endeks:** `^GSPC`

## Backend (FastAPI)

PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API dokümantasyonu: [http://localhost:8000/docs](http://localhost:8000/docs)

Özet uçlar: `GET /health`, `GET /symbols/search`, `POST /forecast`, `POST /backtest`.

## Frontend (Next.js)

```powershell
cd frontend
npm install
npm run dev
```

Uygulama: [http://localhost:3000](http://localhost:3000)

Varsayılan API adresi: `NEXT_PUBLIC_API_URL=http://localhost:8000` ([frontend/.env.local](frontend/.env.local)).

## Bilinen kısıtlar

- Yahoo Finance verisi **resmi bir API değildir**; gecikme, eksik seri veya erişim kısıtları oluşabilir.
- Prophet kısa geçmiş ve ani rejim değişimlerinde yanıltıcı olabilir; hackathon demosu için **varsayımsal** bir araçtır (yatırım tavsiyesi değildir).
- Volatilite özeti günlük **log-getiri** üzerinden tahmini **yıllıklandırılmış** standart sapmadır (√252).

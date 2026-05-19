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

Özet uçlar: `GET /health`, `GET /symbols/search`, `GET /market-summary`, `POST /forecast`, `POST /backtest`, `POST /compare`, `GET /quality`, `GET /events`, `POST /events/impact`, `POST /feedback`. İstek gövdelerinde opsiyonel `asset_class`: `auto` | `crypto` | `fx` | `stock`. **`train_until` + opsiyonel `data_start`**: kesit modunda model yalnızca `train_until` (dahil) tarihine kadar eğitilir; sonraki gerçek kapanışlarla RMSE/MAE ve ortalama bias hesaplanır.

### Frontend sayfaları

- **Analiz merkezi** (`/analiz`): tahmin, karşılaştır, portföy taslağı, veri kalitesi, olay takvimi
- **Kurumsal:** `/home`, `/hizmetler`, `/hakkimizda`, `/iletisim`, `/guvenlik`, `/yardim`, yasal sayfalar
- Landing: `/`

### Tarayıcıda «NetworkError / Failed to fetch»

Bu genelde **FastAPI çalışmıyor** veya adres yanlış demektir. Önce backend’i **8000** portunda başlatın (`uvicorn ...`). Frontend adresinin `.env.local` içindeki `NEXT_PUBLIC_API_URL` ile aynı host olduğundan emin olun (`localhost` vs `127.0.0.1`).

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
- Volatilite özeti günlük **log-getiri** üzerinden tahmini yıllıklandırılmış standart sapmadır; **hisse/döviz** profili √252, **kripto** profili √365 ölçeği kullanır (`asset_class`).

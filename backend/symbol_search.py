"""Esnek varlık arama: Türkçe/İngilizce takma adlar + Yahoo Finance arama.

Kullanıcı "dinar", "altın", "petrol", "tesla" gibi serbest metinler yazınca
ilgili Yahoo Finance sembollerini bulur. Yahoo'nun kendi arama API'si Türkçe
sorgulara ve para birimi isimlerine karşı zayıf cevap verdiği için burada
geniş bir dahili sözlük tutuyor ve gerekirse alternatif sorgular deniyoruz.
"""

from __future__ import annotations

import unicodedata
from typing import Iterable

import httpx

from schemas import SymbolSearchItem


_BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)

# Sembol → kullanıcıya gösterilecek Türkçe isim. Backend genelinde tutarlı
# kalsın diye burada da minimum bir liste tutuyoruz; yetmediği yerde Yahoo'dan
# gelen `longname/shortname` alanları devreye girer.
SYMBOL_NAMES: dict[str, str] = {
    # FX — TL bazlı para birimleri (TL üzerinden değerlemesi gösterilir)
    "USDTRY=X": "ABD Doları",
    "EURTRY=X": "Euro",
    "GBPTRY=X": "İngiliz Sterlini",
    "JPYTRY=X": "Japon Yeni",
    "CHFTRY=X": "İsviçre Frangı",
    "CADTRY=X": "Kanada Doları",
    "AUDTRY=X": "Avustralya Doları",
    "NZDTRY=X": "Yeni Zelanda Doları",
    "CNYTRY=X": "Çin Yuanı",
    "RUBTRY=X": "Rus Rublesi",
    "SEKTRY=X": "İsveç Kronu",
    "NOKTRY=X": "Norveç Kronu",
    "DKKTRY=X": "Danimarka Kronu",
    "PLNTRY=X": "Polonya Zlotisi",
    "HUFTRY=X": "Macar Forinti",
    "CZKTRY=X": "Çek Korunası",
    "ZARTRY=X": "Güney Afrika Randı",
    "BRLTRY=X": "Brezilya Reali",
    "MXNTRY=X": "Meksika Pesosu",
    "INRTRY=X": "Hint Rupisi",
    "KRWTRY=X": "Güney Kore Wonu",
    "THBTRY=X": "Tayland Bahtı",
    "IDRTRY=X": "Endonezya Rupiası",
    "MYRTRY=X": "Malezya Ringgiti",
    "PHPTRY=X": "Filipin Pesosu",
    "ILSTRY=X": "İsrail Şekeli",
    "SARTRY=X": "Suudi Arabistan Riyali",
    "AEDTRY=X": "BAE Dirhemi",
    "QARTRY=X": "Katar Riyali",
    "KWDTRY=X": "Kuveyt Dinarı",
    "BHDTRY=X": "Bahreyn Dinarı",
    "JODTRY=X": "Ürdün Dinarı",
    "OMRTRY=X": "Umman Riyali",
    "EGPTRY=X": "Mısır Pound'u",
    "AZNTRY=X": "Azerbaycan Manatı",
    # FX — Majör pariteler
    "EURUSD=X": "Euro / ABD Doları",
    "GBPUSD=X": "Sterlin / ABD Doları",
    "USDJPY=X": "ABD Doları / Japon Yeni",
    "USDCHF=X": "ABD Doları / İsviçre Frangı",
    "USDCAD=X": "ABD Doları / Kanada Doları",
    "AUDUSD=X": "Avustralya Doları / ABD Doları",
    "NZDUSD=X": "Yeni Zelanda Doları / ABD Doları",
    "USDCNY=X": "ABD Doları / Çin Yuanı",
    "USDRUB=X": "ABD Doları / Rus Rublesi",
    # Emtia (futures)
    "GC=F": "Altın vadeli (COMEX)",
    "SI=F": "Gümüş vadeli (COMEX)",
    "HG=F": "Bakır vadeli",
    "PL=F": "Platin vadeli",
    "PA=F": "Paladyum vadeli",
    "CL=F": "Ham petrol (WTI)",
    "BZ=F": "Brent ham petrol",
    "NG=F": "Doğalgaz vadeli",
    "ZW=F": "Buğday vadeli",
    "ZC=F": "Mısır vadeli",
    "KC=F": "Kahve vadeli",
    "CC=F": "Kakao vadeli",
    "SB=F": "Şeker vadeli",
    "CT=F": "Pamuk vadeli",
    # Spot metaller
    "XAUUSD=X": "Altın (Ons / USD spot)",
    "XAGUSD=X": "Gümüş (Ons / USD spot)",
    # Kripto
    "BTC-USD": "Bitcoin",
    "ETH-USD": "Ethereum",
    "SOL-USD": "Solana",
    "XRP-USD": "XRP",
    "BNB-USD": "BNB",
    "DOGE-USD": "Dogecoin",
    "ADA-USD": "Cardano",
    "AVAX-USD": "Avalanche",
    "DOT-USD": "Polkadot",
    "MATIC-USD": "Polygon",
    "LINK-USD": "Chainlink",
    "LTC-USD": "Litecoin",
    "TRX-USD": "TRON",
    "SHIB-USD": "Shiba Inu",
    # Endeksler
    "^GSPC": "S&P 500",
    "^IXIC": "Nasdaq Composite",
    "^DJI": "Dow Jones Industrial Average",
    "^VIX": "VIX Volatilite Endeksi",
    "^GDAXI": "DAX (Almanya)",
    "^FTSE": "FTSE 100 (Birleşik Krallık)",
    "^N225": "Nikkei 225 (Japonya)",
    "^HSI": "Hang Seng (Hong Kong)",
    "XU100.IS": "BIST 100",
    # BIST hisseleri
    "THYAO.IS": "Türk Hava Yolları",
    "ASELS.IS": "ASELSAN",
    "GARAN.IS": "Garanti BBVA",
    "AKBNK.IS": "Akbank",
    "ISCTR.IS": "İş Bankası (C)",
    "YKBNK.IS": "Yapı Kredi Bankası",
    "BIMAS.IS": "BİM",
    "TUPRS.IS": "Tüpraş",
    "EREGL.IS": "Ereğli Demir Çelik",
    "SISE.IS": "Şişecam",
    "KCHOL.IS": "Koç Holding",
    "SAHOL.IS": "Sabancı Holding",
    "FROTO.IS": "Ford Otosan",
    "TOASO.IS": "Tofaş",
    "ARCLK.IS": "Arçelik",
    "PETKM.IS": "Petkim",
    "TCELL.IS": "Turkcell",
    "EKGYO.IS": "Emlak Konut GYO",
    "VAKBN.IS": "VakıfBank",
    "HALKB.IS": "Halkbank",
    "TTKOM.IS": "Türk Telekom",
    # ABD hisseleri (popüler)
    "AAPL": "Apple",
    "MSFT": "Microsoft",
    "GOOGL": "Alphabet (Google)",
    "AMZN": "Amazon",
    "META": "Meta Platforms",
    "NVDA": "NVIDIA",
    "TSLA": "Tesla",
    "AMD": "AMD",
    "INTC": "Intel",
    "NFLX": "Netflix",
    "JPM": "JPMorgan Chase",
    "V": "Visa",
    "MA": "Mastercard",
    "DIS": "The Walt Disney Co.",
    "BA": "Boeing",
    "KO": "The Coca-Cola Co.",
    "PEP": "PepsiCo",
    "WMT": "Walmart",
    "BABA": "Alibaba",
}


def _strip_accents(text: str) -> str:
    """Türkçe karakterleri normalize et (ı→i, ş→s, ç→c vb.)."""

    text = text.replace("ı", "i").replace("İ", "I")
    return "".join(
        c for c in unicodedata.normalize("NFKD", text) if not unicodedata.combining(c)
    )


def _norm(text: str) -> str:
    return _strip_accents(text).strip().lower()


# Türkçe/İngilizce serbest metin → Yahoo Finance sembol listesi.
# Anahtarlar normalize edilmiş (aksansız, küçük harf) parçaları içerir;
# kullanıcı sorgusu bu anahtarlardan herhangi birini "içerirse" semboller
# sonuç listesine eklenir.
ALIASES: dict[str, list[str]] = {
    # --- Para birimleri (TL bazlı tercih edilir) ---
    "dinar": ["KWDTRY=X", "BHDTRY=X", "JODTRY=X"],
    "kuveyt": ["KWDTRY=X"],
    "kuwait": ["KWDTRY=X"],
    "bahreyn": ["BHDTRY=X"],
    "bahrain": ["BHDTRY=X"],
    "urdun": ["JODTRY=X"],
    "ürdün": ["JODTRY=X"],
    "jordan": ["JODTRY=X"],
    "umman": ["OMRTRY=X"],
    "oman": ["OMRTRY=X"],
    "katar": ["QARTRY=X"],
    "qatar": ["QARTRY=X"],
    "suudi": ["SARTRY=X"],
    "saudi": ["SARTRY=X"],
    "riyal": ["SARTRY=X", "QARTRY=X", "OMRTRY=X"],
    "rial": ["SARTRY=X", "QARTRY=X", "OMRTRY=X"],
    "dirhem": ["AEDTRY=X"],
    "dirham": ["AEDTRY=X"],
    "bae": ["AEDTRY=X"],
    "emirlikleri": ["AEDTRY=X"],
    "uae": ["AEDTRY=X"],
    "dolar": ["USDTRY=X"],
    "dollar": ["USDTRY=X"],
    "usd": ["USDTRY=X"],
    "abd": ["USDTRY=X"],
    "amerikan": ["USDTRY=X"],
    "euro": ["EURTRY=X"],
    "avro": ["EURTRY=X"],
    "eur": ["EURTRY=X"],
    "sterlin": ["GBPTRY=X"],
    "pound": ["GBPTRY=X"],
    "ingiliz": ["GBPTRY=X"],
    "gbp": ["GBPTRY=X"],
    "yen": ["JPYTRY=X"],
    "japon": ["JPYTRY=X"],
    "japonya": ["JPYTRY=X"],
    "jpy": ["JPYTRY=X"],
    "frank": ["CHFTRY=X"],
    "franc": ["CHFTRY=X"],
    "isvicre": ["CHFTRY=X"],
    "isviçre": ["CHFTRY=X"],
    "chf": ["CHFTRY=X"],
    "kanada": ["CADTRY=X"],
    "cad": ["CADTRY=X"],
    "avustralya": ["AUDTRY=X"],
    "aussie": ["AUDTRY=X"],
    "aud": ["AUDTRY=X"],
    "kiwi": ["NZDTRY=X"],
    "yeni zelanda": ["NZDTRY=X"],
    "nzd": ["NZDTRY=X"],
    "yuan": ["CNYTRY=X"],
    "renminbi": ["CNYTRY=X"],
    "cin": ["CNYTRY=X"],
    "çin": ["CNYTRY=X"],
    "cny": ["CNYTRY=X"],
    "rmb": ["CNYTRY=X"],
    "ruble": ["RUBTRY=X"],
    "rus": ["RUBTRY=X"],
    "rusya": ["RUBTRY=X"],
    "rub": ["RUBTRY=X"],
    "rupi": ["INRTRY=X"],
    "rupee": ["INRTRY=X"],
    "hint": ["INRTRY=X"],
    "inr": ["INRTRY=X"],
    "won": ["KRWTRY=X"],
    "kore": ["KRWTRY=X"],
    "krw": ["KRWTRY=X"],
    "baht": ["THBTRY=X"],
    "tayland": ["THBTRY=X"],
    "thb": ["THBTRY=X"],
    "rupiah": ["IDRTRY=X"],
    "endonezya": ["IDRTRY=X"],
    "idr": ["IDRTRY=X"],
    "ringgit": ["MYRTRY=X"],
    "malezya": ["MYRTRY=X"],
    "myr": ["MYRTRY=X"],
    "peso": ["MXNTRY=X", "PHPTRY=X"],
    "meksika": ["MXNTRY=X"],
    "mxn": ["MXNTRY=X"],
    "filipin": ["PHPTRY=X"],
    "real": ["BRLTRY=X"],
    "brezilya": ["BRLTRY=X"],
    "brl": ["BRLTRY=X"],
    "rand": ["ZARTRY=X"],
    "guney afrika": ["ZARTRY=X"],
    "zar": ["ZARTRY=X"],
    "sekel": ["ILSTRY=X"],
    "shekel": ["ILSTRY=X"],
    "israil": ["ILSTRY=X"],
    "ils": ["ILSTRY=X"],
    "krone": ["SEKTRY=X", "NOKTRY=X", "DKKTRY=X"],
    "kron": ["SEKTRY=X", "NOKTRY=X", "DKKTRY=X"],
    "isvec": ["SEKTRY=X"],
    "isveç": ["SEKTRY=X"],
    "sweden": ["SEKTRY=X"],
    "sek": ["SEKTRY=X"],
    "norvec": ["NOKTRY=X"],
    "norveç": ["NOKTRY=X"],
    "norway": ["NOKTRY=X"],
    "nok": ["NOKTRY=X"],
    "danimarka": ["DKKTRY=X"],
    "denmark": ["DKKTRY=X"],
    "dkk": ["DKKTRY=X"],
    "zloty": ["PLNTRY=X"],
    "polonya": ["PLNTRY=X"],
    "pln": ["PLNTRY=X"],
    "forint": ["HUFTRY=X"],
    "macar": ["HUFTRY=X"],
    "huf": ["HUFTRY=X"],
    "koruna": ["CZKTRY=X"],
    "cek": ["CZKTRY=X"],
    "çek": ["CZKTRY=X"],
    "czk": ["CZKTRY=X"],
    "manat": ["AZNTRY=X"],
    "azerbaycan": ["AZNTRY=X"],
    "azn": ["AZNTRY=X"],
    "misir": ["EGPTRY=X"],
    "mısır": ["EGPTRY=X", "ZC=F"],  # ülke / tarım
    "egypt": ["EGPTRY=X"],
    "lira": ["USDTRY=X", "EURTRY=X"],
    "turk lirasi": ["USDTRY=X", "EURTRY=X"],
    "türk lirası": ["USDTRY=X", "EURTRY=X"],
    "try": ["USDTRY=X", "EURTRY=X"],
    # --- Kıymetli metaller / emtialar ---
    "altin": ["GC=F", "XAUUSD=X"],
    "altın": ["GC=F", "XAUUSD=X"],
    "gold": ["GC=F", "XAUUSD=X"],
    "ons": ["XAUUSD=X", "GC=F"],
    "xau": ["XAUUSD=X"],
    "gumus": ["SI=F", "XAGUSD=X"],
    "gümüş": ["SI=F", "XAGUSD=X"],
    "silver": ["SI=F", "XAGUSD=X"],
    "xag": ["XAGUSD=X"],
    "platin": ["PL=F"],
    "platinum": ["PL=F"],
    "paladyum": ["PA=F"],
    "palladium": ["PA=F"],
    "bakir": ["HG=F"],
    "bakır": ["HG=F"],
    "copper": ["HG=F"],
    "petrol": ["BZ=F", "CL=F"],
    "oil": ["BZ=F", "CL=F"],
    "brent": ["BZ=F"],
    "ham petrol": ["CL=F", "BZ=F"],
    "wti": ["CL=F"],
    "dogalgaz": ["NG=F"],
    "doğalgaz": ["NG=F"],
    "gaz": ["NG=F"],
    "natural gas": ["NG=F"],
    "bugday": ["ZW=F"],
    "buğday": ["ZW=F"],
    "wheat": ["ZW=F"],
    "corn": ["ZC=F"],
    "kahve": ["KC=F"],
    "coffee": ["KC=F"],
    "kakao": ["CC=F"],
    "cocoa": ["CC=F"],
    "seker": ["SB=F"],
    "şeker": ["SB=F"],
    "sugar": ["SB=F"],
    "pamuk": ["CT=F"],
    "cotton": ["CT=F"],
    # --- Kripto ---
    "bitcoin": ["BTC-USD"],
    "btc": ["BTC-USD"],
    "ethereum": ["ETH-USD"],
    "eth": ["ETH-USD"],
    "ether": ["ETH-USD"],
    "solana": ["SOL-USD"],
    "ripple": ["XRP-USD"],
    "xrp": ["XRP-USD"],
    "cardano": ["ADA-USD"],
    "ada": ["ADA-USD"],
    "dogecoin": ["DOGE-USD"],
    "doge": ["DOGE-USD"],
    "shiba": ["SHIB-USD"],
    "polkadot": ["DOT-USD"],
    "polygon": ["MATIC-USD"],
    "chainlink": ["LINK-USD"],
    "litecoin": ["LTC-USD"],
    "avalanche": ["AVAX-USD"],
    "binance": ["BNB-USD"],
    "bnb": ["BNB-USD"],
    "tron": ["TRX-USD"],
    "kripto": ["BTC-USD", "ETH-USD", "SOL-USD"],
    "crypto": ["BTC-USD", "ETH-USD", "SOL-USD"],
    # --- Endeksler / borsalar ---
    "bist": ["XU100.IS"],
    "borsa istanbul": ["XU100.IS"],
    "xu100": ["XU100.IS"],
    "sp500": ["^GSPC"],
    "s&p": ["^GSPC"],
    "snp": ["^GSPC"],
    "nasdaq": ["^IXIC"],
    "dow": ["^DJI"],
    "dow jones": ["^DJI"],
    "vix": ["^VIX"],
    "dax": ["^GDAXI"],
    "almanya": ["^GDAXI"],
    "ftse": ["^FTSE"],
    "ingiltere": ["^FTSE", "GBPTRY=X"],
    "nikkei": ["^N225"],
    "hang seng": ["^HSI"],
    "hong kong": ["^HSI"],
    # --- Sık aranan BIST hisseleri (kısa adlar) ---
    "thy": ["THYAO.IS"],
    "thyao": ["THYAO.IS"],
    "turk hava": ["THYAO.IS"],
    "türk hava": ["THYAO.IS"],
    "aselsan": ["ASELS.IS"],
    "garanti": ["GARAN.IS"],
    "akbank": ["AKBNK.IS"],
    "is bankasi": ["ISCTR.IS"],
    "iş bankası": ["ISCTR.IS"],
    "yapi kredi": ["YKBNK.IS"],
    "yapı kredi": ["YKBNK.IS"],
    "bim": ["BIMAS.IS"],
    "tupras": ["TUPRS.IS"],
    "tüpraş": ["TUPRS.IS"],
    "eregli": ["EREGL.IS"],
    "ereğli": ["EREGL.IS"],
    "sisecam": ["SISE.IS"],
    "şişecam": ["SISE.IS"],
    "koc": ["KCHOL.IS"],
    "koç": ["KCHOL.IS"],
    "sabanci": ["SAHOL.IS"],
    "sabancı": ["SAHOL.IS"],
    "ford otosan": ["FROTO.IS"],
    "tofas": ["TOASO.IS"],
    "tofaş": ["TOASO.IS"],
    "arcelik": ["ARCLK.IS"],
    "arçelik": ["ARCLK.IS"],
    "petkim": ["PETKM.IS"],
    "turkcell": ["TCELL.IS"],
    "emlak konut": ["EKGYO.IS"],
    "vakifbank": ["VAKBN.IS"],
    "vakıfbank": ["VAKBN.IS"],
    "halkbank": ["HALKB.IS"],
    "turk telekom": ["TTKOM.IS"],
    "türk telekom": ["TTKOM.IS"],
    # --- ABD hisseleri (Türkçe yazımlar) ---
    "apple": ["AAPL"],
    "elma": ["AAPL"],
    "microsoft": ["MSFT"],
    "google": ["GOOGL"],
    "alphabet": ["GOOGL"],
    "amazon": ["AMZN"],
    "meta": ["META"],
    "facebook": ["META"],
    "nvidia": ["NVDA"],
    "tesla": ["TSLA"],
    "amd": ["AMD"],
    "intel": ["INTC"],
    "netflix": ["NFLX"],
    "jpmorgan": ["JPM"],
    "visa": ["V"],
    "mastercard": ["MA"],
    "disney": ["DIS"],
    "boeing": ["BA"],
    "coca cola": ["KO"],
    "kola": ["KO", "PEP"],
    "pepsi": ["PEP"],
    "walmart": ["WMT"],
    "alibaba": ["BABA"],
}


# Yahoo'nun anlamlı sonuç vereceği eşdeğer İngilizce sorgular. "dinar" tek
# başına 0 sonuç dönerken, "kuwait" iyi sonuç döndürüyor; o yüzden bazı
# Türkçe terimleri Yahoo'da denerken paralel sorgular ekliyoruz.
QUERY_EXPANSIONS: dict[str, list[str]] = {
    "dinar": ["kuwait", "bahrain", "jordan"],
    "altin": ["gold", "XAU"],
    "altın": ["gold", "XAU"],
    "gumus": ["silver", "XAG"],
    "gümüş": ["silver", "XAG"],
    "petrol": ["brent", "crude oil"],
    "dogalgaz": ["natural gas"],
    "doğalgaz": ["natural gas"],
    "bakir": ["copper"],
    "bakır": ["copper"],
    "bugday": ["wheat"],
    "buğday": ["wheat"],
    "kahve": ["coffee"],
    "seker": ["sugar"],
    "şeker": ["sugar"],
    "pamuk": ["cotton"],
    "sterlin": ["pound"],
    "yen": ["yen"],
    "frank": ["franc"],
    "ruble": ["ruble"],
    "yuan": ["yuan"],
    "won": ["won"],
    "real": ["brazilian real"],
    "rand": ["south african rand"],
    "şekel": ["shekel"],
    "sekel": ["shekel"],
    "riyal": ["saudi riyal"],
    "dirhem": ["uae dirham"],
    "dirham": ["uae dirham"],
    "borsa istanbul": ["BIST"],
    "türk hava": ["turkish airlines"],
    "turk hava": ["turkish airlines"],
}


def _infer_quote_type(symbol: str) -> str:
    if symbol.endswith("-USD"):
        return "CRYPTOCURRENCY"
    if symbol.endswith("=X"):
        return "CURRENCY"
    if symbol.endswith("=F"):
        return "FUTURE"
    if symbol.startswith("^"):
        return "INDEX"
    if symbol.endswith(".IS"):
        return "EQUITY"
    return "EQUITY"


def _curated_item(symbol: str) -> SymbolSearchItem:
    return SymbolSearchItem(
        symbol=symbol,
        name=SYMBOL_NAMES.get(symbol, symbol),
        exchange="Yahoo Finance",
        quote_type=_infer_quote_type(symbol),
        source="curated",
    )


def _append(rows: list[SymbolSearchItem], item: SymbolSearchItem) -> None:
    if not item.symbol:
        return
    if item.symbol in {r.symbol for r in rows}:
        return
    rows.append(item)


def _yahoo_query(client: httpx.Client, q: str, *, source: str = "yahoo") -> list[SymbolSearchItem]:
    try:
        resp = client.get(
            "https://query1.finance.yahoo.com/v1/finance/search",
            params={"q": q, "quotesCount": 12, "newsCount": 0, "lang": "en-US", "region": "US"},
            headers={"User-Agent": _BROWSER_UA, "Accept": "application/json"},
            timeout=5.0,
        )
        resp.raise_for_status()
        quotes = resp.json().get("quotes", []) or []
    except Exception:
        return []

    items: list[SymbolSearchItem] = []
    for quote in quotes:
        sym = str(quote.get("symbol") or "").strip().upper()
        if not sym:
            continue
        name = str(
            quote.get("longname")
            or quote.get("shortname")
            or quote.get("name")
            or SYMBOL_NAMES.get(sym, sym)
        ).strip() or sym
        exchange = (
            str(quote.get("exchDisp") or quote.get("exchange") or "").strip() or None
        )
        quote_type = (
            str(quote.get("quoteType") or quote.get("typeDisp") or "").strip() or None
        )
        items.append(
            SymbolSearchItem(
                symbol=sym,
                name=SYMBOL_NAMES.get(sym, name),
                exchange=exchange,
                quote_type=quote_type,
                source=source,
            )
        )
    return items


def _alias_hits(query_norm: str) -> Iterable[str]:
    """Sorguda geçen herhangi bir takma adı yakalar (parçalı eşleşme)."""

    matches: list[tuple[int, str]] = []
    for key, symbols in ALIASES.items():
        key_norm = _norm(key)
        if not key_norm:
            continue
        if key_norm in query_norm or query_norm in key_norm:
            # Daha uzun anahtarlar daha spesifiktir → öne çıksın.
            for sym in symbols:
                matches.append((len(key_norm), sym))
    matches.sort(key=lambda x: -x[0])
    seen: set[str] = set()
    for _, sym in matches:
        if sym in seen:
            continue
        seen.add(sym)
        yield sym


def _local_name_hits(query_norm: str) -> Iterable[str]:
    """Sembol veya gösterim isminde geçen tüm kayıtlı sembolleri döndürür."""

    for symbol, name in SYMBOL_NAMES.items():
        if query_norm in _norm(symbol) or query_norm in _norm(name):
            yield symbol


DEFAULT_SUGGESTIONS = [
    "USDTRY=X",
    "EURTRY=X",
    "GBPTRY=X",
    "KWDTRY=X",
    "BHDTRY=X",
    "JODTRY=X",
    "GC=F",
    "SI=F",
    "BZ=F",
    "BTC-USD",
    "ETH-USD",
    "SOL-USD",
    "THYAO.IS",
    "ASELS.IS",
    "GARAN.IS",
    "AKBNK.IS",
    "AAPL",
    "MSFT",
    "NVDA",
    "TSLA",
    "GOOGL",
    "AMZN",
    "^GSPC",
    "^IXIC",
    "^DJI",
]


def search_symbols(query: str, *, limit: int = 25) -> list[SymbolSearchItem]:
    """Esnek varlık arama. Boş sorgu ise öne çıkan listeyi döner."""

    raw = (query or "").strip()
    if not raw:
        return [_curated_item(s) for s in DEFAULT_SUGGESTIONS]

    q_norm = _norm(raw)
    rows: list[SymbolSearchItem] = []

    for sym in _alias_hits(q_norm):
        _append(rows, _curated_item(sym))

    direct = raw.upper().replace(" ", "")
    if 1 < len(direct) <= 16 and any(c.isalnum() for c in direct):
        if direct in SYMBOL_NAMES or "=" in direct or "-" in direct or "^" in direct or "." in direct:
            _append(rows, _curated_item(direct))

    queries: list[str] = [raw]
    for key, expansions in QUERY_EXPANSIONS.items():
        if _norm(key) in q_norm:
            for exp in expansions:
                if exp not in queries:
                    queries.append(exp)

    try:
        with httpx.Client() as client:
            for q in queries[:4]:
                for item in _yahoo_query(client, q):
                    _append(rows, item)
                if len(rows) >= limit:
                    break
    except Exception:
        pass

    for sym in _local_name_hits(q_norm):
        if len(rows) >= limit:
            break
        _append(rows, _curated_item(sym))

    if not rows:
        for sym in DEFAULT_SUGGESTIONS[:8]:
            _append(rows, _curated_item(sym))

    return rows[:limit]

/**
 * Backend API kök adresi.
 * - Yerel: doğrudan uvicorn (8000) veya NEXT_PUBLIC_API_URL
 * - Vercel Services: /_backend (routePrefix) veya API_URL / NEXT_PUBLIC_API_URL
 */

const LOCAL_BACKEND = "http://127.0.0.1:8000";
const VERCEL_BACKEND_PATH = "/_backend";

function isLocalHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

/** Sunucu tarafında göreli yolu mutlak URL'ye çevirir */
function resolveServerRelativeBase(relativePath: string): string {
  const path = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) {
    return `https://${vercelHost}${path}`;
  }
  return LOCAL_BACKEND;
}

function normalizeEnvApiUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    if (typeof window !== "undefined") return trimmed;
    return resolveServerRelativeBase(trimmed);
  }
  return trimmed;
}

/** Tüm istemci ve sunucu API çağrıları için tek kaynak */
export function getApiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (fromEnv) return normalizeEnvApiUrl(fromEnv);

  if (typeof window !== "undefined") {
    return isLocalHostname(window.location.hostname) ? LOCAL_BACKEND : VERCEL_BACKEND_PATH;
  }

  if (process.env.VERCEL === "1") {
    const serverApi = process.env.API_URL?.trim();
    if (serverApi) return normalizeEnvApiUrl(serverApi);
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}${VERCEL_BACKEND_PATH}`;
    }
  }

  return LOCAL_BACKEND;
}

export function buildApiUrl(path: string, params?: Record<string, string | undefined>): string {
  const base = getApiBase().replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  const url = `${base}${normalizedPath}`;
  return qs ? `${url}?${qs}` : url;
}

export function apiNetworkErrorHint(): string {
  if (typeof window !== "undefined" && !isLocalHostname(window.location.hostname)) {
    return "Veri servisine ulaşılamadı. Lütfen sayfayı yenileyin veya bir süre sonra tekrar deneyin.";
  }
  return "API sunucusuna bağlanılamadı. Yerelde backend çalışıyor mu? `backend` klasöründe: uvicorn main:app --reload --port 8000";
}

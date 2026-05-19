/** Browser localStorage helpers with JSON serialization and SSR safety. */

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded — ignore */
  }
}

export function removeKey(key: string): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(key);
}

export const STORAGE_KEYS = {
  lastAnalysis: "financescout_last_analysis",
  feedbackVotes: "financescout_feature_votes",
  userFeatureVote: "financescout_user_feature_vote",
  servicesRatingCounts: "financescout_services_rating_counts",
  servicesUserRating: "financescout_services_user_rating",
} as const;

export type LastAnalysisSnapshot = {
  symbol: string;
  asset_class: string;
  history_days: number;
  forecast_days: number;
  train_until?: string;
  forecast: import("@/lib/api").ForecastApiResponse;
  saved_at: string;
};

import { describe, expect, it } from "vitest";

import { STORAGE_KEYS } from "@/lib/storage";

describe("storage keys", () => {
  it("exports stable keys", () => {
    expect(STORAGE_KEYS.lastAnalysis).toBe("financescout_last_analysis");
    expect(STORAGE_KEYS.feedbackVotes).toBe("financescout_feature_votes");
  });
});

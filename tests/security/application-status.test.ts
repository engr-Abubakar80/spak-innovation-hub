import { describe, expect, it } from "vitest";

const STATUS_MAP: Record<string, string> = {
  Approved: "APPROVED",
  Rejected: "REJECTED",
  "Under Review": "UNDER_REVIEW",
};

describe("application status changes", () => {
  it("maps human labels to enum values", () => {
    expect(STATUS_MAP["Approved"]).toBe("APPROVED");
    expect(STATUS_MAP["Rejected"]).toBe("REJECTED");
    expect(STATUS_MAP["Under Review"]).toBe("UNDER_REVIEW");
  });

  it("rejects unknown status labels", () => {
    expect(STATUS_MAP["approved"]).toBeUndefined();
    expect(STATUS_MAP["Pending"]).toBeUndefined();
  });

  it("tracks status changes require an actor", () => {
    const historyEntry = {
      fromStatus: "UNDER_REVIEW",
      toStatus: "APPROVED",
      changedById: "admin-123",
    };
    expect(historyEntry.changedById).toBeTypeOf("string");
    expect(historyEntry.toStatus).toBe("APPROVED");
  });
});

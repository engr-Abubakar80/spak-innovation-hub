import { describe, expect, it } from "vitest";
import { getSocialLinks, OFFICIAL_SOCIAL_LINKS } from "@/lib/social";

describe("getSocialLinks", () => {
  it("returns all four official platforms by default", () => {
    expect(getSocialLinks()).toEqual(OFFICIAL_SOCIAL_LINKS);
  });

  it("overrides URLs by platform", () => {
    const links = getSocialLinks([
      { platform: "x", label: "X", url: "https://x.com/custom" },
      { platform: "facebook", label: "Facebook", url: null },
      { platform: "tiktok", label: "TikTok", url: "https://tiktok.com/custom" },
    ]);
    expect(links.find((link) => link.platform === "x")?.url).toBe("https://x.com/custom");
    expect(links.find((link) => link.platform === "facebook")?.url).toBe(
      OFFICIAL_SOCIAL_LINKS.find((link) => link.platform === "facebook")?.url,
    );
    expect(links.map((link) => link.platform)).toEqual([
      "x",
      "instagram",
      "linkedin",
      "facebook",
    ]);
  });
});

export type SocialPlatform = "x" | "instagram" | "linkedin" | "facebook";

export interface SocialLink {
  platform: SocialPlatform;
  label: string;
  url: string;
}

export const OFFICIAL_SOCIAL_LINKS: SocialLink[] = [
  { platform: "x", label: "SPAK Innovation Hub on X", url: "https://x.com/HubSpak/" },
  {
    platform: "instagram",
    label: "SPAK Innovation Hub on Instagram",
    url: "https://www.instagram.com/spak_hub?gwpx=emR6anl1dDFmdGIw",
  },
  {
    platform: "linkedin",
    label: "SPAK Innovation Hub on LinkedIn",
    url: "https://www.linkedin.com/in/spak-hub-undefined-179a60434?utm_source=share_via&utm_content=profile&utm_medium=member_android",
  },
  {
    platform: "facebook",
    label: "SPAK Innovation Hub on Facebook",
    url: "https://www.facebook.com/profile.php?id=61594524221813",
  },
];

type StoredSocialLink = { platform: string; label: string; url: string | null };

export function getSocialLinks(stored: StoredSocialLink[] = []): SocialLink[] {
  const overrides = new Map(
    stored
      .filter((item): item is StoredSocialLink & { url: string } => Boolean(item.url))
      .map((item) => [item.platform, item.url]),
  );
  return OFFICIAL_SOCIAL_LINKS.map((link) => ({
    ...link,
    url: overrides.get(link.platform) ?? link.url,
  }));
}

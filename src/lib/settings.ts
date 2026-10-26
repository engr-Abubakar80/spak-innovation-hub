import { prisma } from "./db";

/**
 * Verified defaults sourced from the SPAK Innovation Hub organisational profile
 * document. Administrators can override any of these from the Admin Dashboard.
 */
export const DEFAULT_SETTINGS: Record<string, string> = {
  "org.name": "SPAK Innovation Hub Ltd/GTE",
  "org.shortName": "SPAK Innovation Hub",
  "org.tagline": "Innovating for People and Planet",
  "org.slogan": "Connect • Collaborate • Create",
  "org.established": "2024",
  "org.description":
    "An innovation enabler committed to addressing health, environmental and socioeconomic challenges through inclusive innovation, entrepreneurship and practical solutions.",
  "org.address":
    "CVL02, Dr Sanda Street, 2nd Gate, Janbulo Kabuga Housing Estate, Kano, Nigeria",
  "org.email": "spakhub@gmail.com",
  "org.phone": "",
  "org.website": "",
  "org.hours": "Monday – Friday, 8:00 AM – 6:00 PM",
  "org.timezone": "Africa/Lagos",
  "about.overview":
    "Spak Innovation Hub Ltd/GTE was established and registered with the Corporate Affairs Commission (CAC) in 2024. It is an innovation enabler committed to addressing health, environmental and socioeconomic challenges through inclusive innovation, entrepreneurship and practical solutions. The Hub was established to serve people at the bottom of the ladder, underserved communities and those excluded from opportunities.",
  "about.history":
    "Registered with the Corporate Affairs Commission (CAC) in 2024, SPAK Innovation Hub supports and nurtures startups, provides consulting and training, and offers a conducive coworking environment where creativity can develop and talents can connect, collaborate and create.",
  "about.vision":
    "To become a leading inclusive innovation hub that transforms underserved communities through sustainable solutions, entrepreneurship and accessible opportunities.",
  "about.mission":
    "To enable inclusive innovation by supporting entrepreneurs, nurturing talents, providing practical training and consulting, and developing solutions to health, environmental and socioeconomic challenges.",
  "about.focus":
    "Inclusive innovation, health, environmental sustainability and entrepreneurship",
  "booking.guestEnabled": "true",
  "booking.policy":
    "All booking requests are subject to administrative approval and confirmation of facility availability. Submitting a request does not guarantee a confirmed reservation. Conflicting requests are resolved in order of approval.",
  "booking.cancellationPolicy":
    "Bookings may be cancelled free of charge up to 24 hours before the scheduled start time. Later cancellations are subject to the Hub's discretion.",
  "footer.about":
    "SPAK Innovation Hub is an inclusive innovation enabler providing coworking, training, consulting and startup support in Kano, Nigeria.",
  "privacy.content":
    "We collect only the information required to provide our services, process booking requests and respond to enquiries. Your data is stored securely and is never sold. You may request deletion of your account and associated data at any time by contacting us.",
  "terms.content":
    "By using this platform and submitting booking requests you agree to provide accurate information, comply with the Hub's rules and pay any applicable fees. Final confirmation of all bookings is subject to administrative approval and availability.",
};

export type SettingsMap = Record<string, string>;

/** Load all settings, merged over the verified defaults. */
export async function getSettings(): Promise<SettingsMap> {
  const map: SettingsMap = { ...DEFAULT_SETTINGS };
  try {
    const rows = await prisma.organizationSetting.findMany();
    for (const row of rows) map[row.key] = row.value;
  } catch (error) {
    console.warn("Could not load organization settings; using defaults.", error);
  }
  return map;
}

export async function getSetting(key: string): Promise<string> {
  const row = await prisma.organizationSetting.findUnique({ where: { key } });
  return row?.value ?? DEFAULT_SETTINGS[key] ?? "";
}

export async function setSetting(
  key: string,
  value: string,
  category = "general",
): Promise<void> {
  await prisma.organizationSetting.upsert({
    where: { key },
    update: { value, category },
    create: { key, value, category },
  });
}

export async function setSettings(entries: SettingsMap, category = "general"): Promise<void> {
  await prisma.$transaction(
    Object.entries(entries).map(([key, value]) =>
      prisma.organizationSetting.upsert({
        where: { key },
        update: { value, category },
        create: { key, value, category },
      }),
    ),
  );
}

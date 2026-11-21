import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const sans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
  const name = settings["org.shortName"];
  const description = settings["org.description"];
  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: `${name} — Co-working, Innovation & Enterprise Support`,
      template: `%s | ${name}`,
    },
    description,
    keywords: [
      "SPAK Innovation Hub",
      "co-working Kano",
      "innovation hub Nigeria",
      "meeting room booking",
      "conference hall Kano",
      "startup incubation",
    ],
    openGraph: {
      title: `${name} — Innovating for People and Planet`,
      description,
      url: baseUrl,
      siteName: name,
      type: "website",
    },
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={sans.variable}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OneTrip — share photos in original quality",
  description: "Upload once. Share one link. Download in original quality. Deleted automatically.",
  robots: { index: false, follow: false },
  referrer: "no-referrer", // album URLs are credentials; don't leak them via Referer
  icons: { icon: "/onetrip.svg" },
};

export const viewport: Viewport = { themeColor: "#fffaf0", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}

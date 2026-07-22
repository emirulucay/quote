import type { Metadata } from "next";
import { Outfit, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://quote.emirulucay.com"),
  title: "Quote – Minimal & Fast Invoice Generator",
  description: "Create, customize, and export clean PDF quotes and invoices in seconds. Built by Emir Uluçay.",
  openGraph: {
    title: "Quote – Minimal & Fast Invoice Generator",
    description: "Create, customize, and export clean PDF quotes and invoices in seconds. Built by Emir Uluçay.",
    url: "https://quote.emirulucay.com",
    siteName: "Quote",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quote – Minimal & Fast Invoice Generator",
    description: "Create, customize, and export clean PDF quotes and invoices in seconds. Built by Emir Uluçay.",
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plexSans.className} ${outfit.variable} ${plexSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}

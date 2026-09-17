import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from "next";
import { Geist, IBM_Plex_Sans, JetBrains_Mono, Inter, Plus_Jakarta_Sans, Space_Grotesk, Playfair_Display, Lora } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-face",
  subsets: ["latin", "latin-ext"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-face",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono-face",
  subsets: ["latin", "latin-ext"],
});

const inter = Inter({
  variable: "--font-inter-face",
  subsets: ["latin", "latin-ext"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta-face",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-face",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair-face",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700"],
});

const lora = Lora({
  variable: "--font-lora-face",
  subsets: ["latin", "latin-ext"],
  // 700 is here for Playfair Display, which borrows Lora's ₺ at bold weights.
  weight: ["400", "500", "600", "700"],
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Quote",
  "url": "https://quote.emirulucay.com",
  "description": "Create, customize, and export clean PDF quotes and invoices in seconds. Built by Emir Uluçay.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "All",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
  "author": {
    "@type": "Person",
    "name": "Emir Uluçay",
    "url": "https://github.com/emirulucay",
  },
};

export const metadata: Metadata = {
  metadataBase: new URL("https://quote.emirulucay.com"),
  title: "Quote – Minimal & Fast Invoice Generator",
  description: "Create, customize, and export clean PDF quotes and invoices in seconds. Built by Emir Uluçay.",
  keywords: [
    "invoice generator",
    "quote generator",
    "fatura oluşturma",
    "teklif hazırlama",
    "pdf invoice",
    "free invoice builder",
    "minimal invoice",
    "online fatura",
    "fatura pdf",
  ],
  authors: [{ name: "Emir Uluçay", url: "https://quote.emirulucay.com" }],
  creator: "Emir Uluçay",
  publisher: "Quote",
  alternates: {
    canonical: "https://quote.emirulucay.com",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Quote – Minimal & Fast Invoice Generator",
    description: "Create, customize, and export clean PDF quotes and invoices in seconds. Built by Emir Uluçay.",
    url: "https://quote.emirulucay.com",
    siteName: "Quote",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Quote – Minimal & Fast Invoice Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quote – Minimal & Fast Invoice Generator",
    description: "Create, customize, and export clean PDF quotes and invoices in seconds. Built by Emir Uluçay.",
    creator: "@emirulucay",
    images: ["/opengraph-image.png"],
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
    // The --font-*-face variables live on <html> so the font stacks in globals.css,
    // which are declared on :root, can resolve them. Declared on <body> they would
    // be out of scope and the whole stack would compute to invalid.
    <html
      lang="tr"
      className={`${geist.variable} ${plexSans.variable} ${jetbrainsMono.variable} ${inter.variable} ${jakarta.variable} ${spaceGrotesk.variable} ${playfair.variable} ${lora.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${plexSans.className} antialiased`}>
        {children}
        <Toaster position="bottom-right" />
        <Analytics />
      </body>
    </html>
  );
}

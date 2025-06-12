import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Philosophical Nexus - Journey Through Human Thought",
  description: "Explore 2,500 years of philosophy through an interactive 3D visualization. Navigate through domains of logic, ethics, aesthetics, politics, and metaphysics across different eras.",
  keywords: "philosophy, interactive visualization, philosophers, ethics, logic, metaphysics, aesthetics, politics, history of philosophy",
  authors: [{ name: "Philosophical Nexus Team" }],
  creator: "Philosophical Nexus",
  publisher: "Philosophical Nexus",
  openGraph: {
    title: "Philosophical Nexus",
    description: "Journey through the evolution of human thought",
    type: "website",
    locale: "en_US",
    siteName: "Philosophical Nexus",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Philosophical Nexus - Interactive Philosophy Visualization"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Philosophical Nexus",
    description: "Journey through 2,500 years of philosophy in an interactive 3D experience",
    images: ["/og-image.png"]
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}

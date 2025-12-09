import type { Metadata } from "next";
import "./globals.css";
import "./styles/poker-animations.css";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Texas Hold'em Poker",
  description: "Premium multiplayer poker experience",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  // iOS specific - hide Safari UI in landscape
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* iOS PWA Support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Royal Poker" />
        <link rel="apple-touch-icon" href="/poker-icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/poker-icon-512.png" />
        
        {/* Android PWA Support */}
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* iOS Safari minimal UI */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Preload premium poker table background */}
        <link rel="preload" href="/backgrounds/poker-table-hd.png" as="image" />
        {/* Preload card back for faster loading */}
        <link rel="preload" href="/cards/_0052_BACK.png" as="image" />
      </head>
      <body className="antialiased">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}

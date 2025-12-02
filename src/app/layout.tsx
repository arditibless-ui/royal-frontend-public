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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
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

import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ARKTARENA",
  description: "Web-based Hero Battle Game",
  icons: [{ rel: "icon", url: "/assets/heroes/nolan.png" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body style={{ touchAction: "none", overscrollBehavior: "none" }}>
        {children}
      </body>
    </html>
  );
}

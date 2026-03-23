import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Umbral",
  description: "Control de visitas residencial",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Umbral",
    statusBarStyle: "default"
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}

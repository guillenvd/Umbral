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
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[100] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium"
        >
          Saltar al contenido principal
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

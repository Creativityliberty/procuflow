import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProcuFlow Africa",
  description: "Gestion simple des achats, fournisseurs, commandes, livraisons et factures."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={GeistSans.variable}>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import LayoutShell from "./_components/layout-shell";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: "iFarm",
  description: "Sistema de Gestão Pecuária Inteligente",
};

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}> 
        <LayoutShell>
          {children}
        </LayoutShell>
      </body>
    </html>
  );
}

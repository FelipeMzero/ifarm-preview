import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LayoutShell from "./_components/layout-shell";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans", //"--font-dm-sans"
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fontHeading = Geist({
  variable: "--font-geist-heading",
  subsets: ["latin"],
  weight: "600"
});

export const metadata: Metadata = {
  title: "iFarm",
  description: "Sistema de Gestão Pecuária Inteligente",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} ${fontHeading.variable}`}>
      <body className="bg-background text-foreground">
        <LayoutShell>
          {children}
        </LayoutShell>
        <Toaster />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
// Import all available fonts for AI usage
import "../lib/fonts";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema de Inspeção Veicular",
  description: "Aplicação para gerenciamento e execução de checklists de inspeção veicular.",
  // PWA Meta tags for iOS
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Inspeção',
  },
  formatDetection: {
    telephone: false,
  },
  // PWA Meta tags for Android/General
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#0a0a0a" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        
        {/* Load Lasy bridge script after hydration to avoid hydration mismatches */}
        <Script 
          src="/lasy-bridge.js" 
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
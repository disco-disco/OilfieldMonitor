import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PLINQO OILFIELD - Real-time Well Monitoring",
  description: "Monitor PLINQO oil field production parameters in real-time. Track pressure, temperature, flow rate, and production metrics with PI System integration.",
  keywords: ["PLINQO oilfield", "oil well monitoring", "PI System", "production parameters", "well data", "oil field management"],
  authors: [{ name: "PLINQO OILFIELD Monitoring Team" }],
};

export const viewport = "width=device-width, initial-scale=1";

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
        {children}
      </body>
    </html>
  );
}

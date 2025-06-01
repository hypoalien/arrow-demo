import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arrow AI Voice Bot Demo | Anudeep Anisetty",
  description:
    "A full-stack voice-enabled AI assistant demonstrating real-time speech processing with LLM. Built with Next.js, Groq, and Cartesia Sonic.",
  openGraph: {
    title: "Arrow AI Voice Bot Demo | Anudeep Anisetty",
    description:
      "A full-stack voice-enabled AI assistant demonstrating real-time speech processing with LLM. Built with Next.js, Groq, and Cartesia Sonic.",
    images: [
      {
        url: "/hero.png",
        width: 1200,
        height: 630,
        alt: "Arrow AI Voice Bot Demo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arrow AI Voice Bot Demo | Anudeep Anisetty",
    description:
      "A full-stack voice-enabled AI assistant demonstrating real-time speech processing with LLM. Built with Next.js, Groq, and Cartesia Sonic.",
    images: ["/hero.png"],
  },
};

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
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}

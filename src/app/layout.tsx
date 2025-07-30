import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ISP Billing Platform - Multi-tenant SaaS Solution",
  description: "Modern ISP billing and management platform with multi-tenant architecture. Built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui.",
  keywords: ["ISP Billing", "SaaS", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "Multi-tenant", "React"],
  authors: [{ name: "ISP Billing Team" }],
  openGraph: {
    title: "ISP Billing Platform",
    description: "Multi-tenant ISP billing and management platform",
    url: "https://github.com/Abdullah34123516/isp",
    siteName: "ISP Billing Platform",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ISP Billing Platform",
    description: "Multi-tenant ISP billing and management platform",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

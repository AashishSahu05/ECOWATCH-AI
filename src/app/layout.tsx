import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { AuthProvider } from "@/lib/auth/context";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nagardrishti AI — Smart Environmental & Waste Intelligence Platform",
  description:
    "A next-generation civic AI platform uniting edge computer vision, spatial hotspot telemetry, and municipal operations workflows to eliminate urban waste mismanagement.",
  keywords: [
    "Nagardrishti AI",
    "Smart Waste Management",
    "Civic AI",
    "Illegal Dumping Detection",
    "Computer Vision Waste Sorting",
    "Google Startup Buildathon",
    "Urban Environmental Intelligence",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col bg-brand-warm-white text-brand-charcoal font-inter antialiased">
        <AuthProvider>
          <SiteLayout>{children}</SiteLayout>
        </AuthProvider>
      </body>
    </html>
  );
}


import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { LanguageProvider } from "@/lib/LanguageContext";
import { ThemeProvider } from "@/lib/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GramNirnay AI | Rural Business Intelligence",
  description: "AI-Driven Hyper-Local Business Advisory and Financial Structuring Assistant for Rural Micro-Entrepreneurs.",
  openGraph: {
    title: "GramNirnay AI",
    description: "Hyper-Local Business Intelligence for Rural Micro-Entrepreneurs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GramNirnay AI",
    description: "Hyper-Local Business Intelligence for Rural Micro-Entrepreneurs",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <LanguageProvider>
            <LanguageSwitcher />
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Appbar } from "@/components/Appbar";
import { ThemeProvider } from "@/components/theme-provider";
import { ScrollToTop } from "@/components/ScrollToTop";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Providers } from "./Providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Nikhil Chavan Full Stack Developer Portfolio",
  description:
    "Welcome to my portfolio site, where you can view my projects, professional experience, and skills. Let's connect and explore potential collaborations together.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <Appbar />
            {children}
            <ScrollToTop />
          </Providers>
        </ThemeProvider>
      </body>
      <GoogleAnalytics gaId="G-QQDK7W7LM4" />
    </html>
  );
}

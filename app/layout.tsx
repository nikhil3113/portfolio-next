import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Appbar } from "@/components/Appbar";
import { ThemeProvider } from "@/components/theme-provider";
import { ScrollToTop } from "@/components/ScrollToTop";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Providers } from "./Providers";

const siteUrl = "https://nikchavan.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Full Stack Developer Portfolio | Nikhil Chavan",
    template: "%s | Full Stack Developer Portfolio",
  },
  description:
    "Full Stack Developer Portfolio of Nikhil Chavan. Modern web apps, scalable APIs, projects, blogs, and expertise in React, Next.js, TypeScript, Node.js.",
  keywords: [
    "full stack developer portfolio",
    "next.js developer",
    "react developer",
    "typescript engineer",
    "web developer portfolio",
    "node.js projects",
  ],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Full Stack Developer Portfolio | Nikhil Chavan",
    description:
      "Explore projects, articles, and experience building modern full stack applications with Next.js, React, TypeScript, and Node.js.",
    siteName: "Nikhil Chavan Portfolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Full Stack Developer Portfolio | Nikhil Chavan",
    description:
      "Projects & articles showcasing modern full stack development with React, Next.js and TypeScript.",
  },
  other: {
    "google-site-verification": "5gjaQq-E7AeichpVI8Qa64ah0ICxs_iaO4ioHjgOeOk",
  },
};

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Nikhil Chavan",
    url: siteUrl,
    jobTitle: "Full Stack Developer",
    sameAs: [
      "https://github.com/yourhandle",
      "https://www.linkedin.com/in/yourhandle",
    ],
    knowsAbout: [
      "Full Stack Development",
      "Next.js",
      "TypeScript",
      "React",
      "Node.js",
    ],
  };
  const webSiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Full Stack Developer Portfolio | Nikhil Chavan",
    url: siteUrl,
    inLanguage: "en",
    description:
      "Full Stack Developer Portfolio highlighting projects, blogs and modern web engineering expertise.",
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="canonical" href={siteUrl} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
        <GoogleAnalytics gaId="G-QQDK7W7LM4" />
      </body>
    </html>
  );
}

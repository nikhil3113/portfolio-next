import type { Metadata } from "next";
import { Hanken_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Appbar } from "@/components/Appbar";
import { ThemeProvider } from "@/components/theme-provider";
import { ScrollToTop } from "@/components/ScrollToTop";
import { GoogleAnalytics } from "@next/third-parties/google";
import { PostHogProvider } from "./Providers";
import { Toaster } from "@/components/ui/sonner";
import { siteUrl } from "@/lib/site";
import { serializeJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Full Stack Developer Portfolio | Nikhil Chavan",
    template: "%s | Nikhil Chavan",
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
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Full Stack Developer Portfolio | Nikhil Chavan",
    description:
      "Explore projects, articles, and experience building modern full stack applications with Next.js, React, TypeScript, and Node.js.",
    siteName: "Nikhil Chavan Portfolio",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Nikhil Chavan - Full Stack Developer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Full Stack Developer Portfolio | Nikhil Chavan",
    description:
      "Projects & articles showcasing modern full stack development with React, Next.js and TypeScript.",
    images: ["/opengraph-image"],
  },
  other: {
    "google-site-verification": "EhFpUqvjGl7jkuGbfRhK71u32bp3BDQFYQSvllx97r8",
  },
};

const headingFont = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["600", "700", "800"],
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const codeFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-code",
  display: "swap",
  weight: ["400", "600"],
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
      "https://github.com/nikhil3113",
      "https://www.linkedin.com/in/nikchavan",
    ],
    knowsAbout: [
      "Full Stack Development",
      "Next.js",
      "TypeScript",
      "React",
      "Node.js",
      "Java",
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
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${headingFont.variable} ${bodyFont.variable} ${codeFont.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(webSiteLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PostHogProvider>
            <Appbar />
            {children}
            <ScrollToTop />
            <Toaster richColors />
          </PostHogProvider>
        </ThemeProvider>
        <GoogleAnalytics gaId="G-QQDK7W7LM4" />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ConsentManager } from "@/components/consent/consent-manager";
import { Toaster } from "@/components/ui/toaster";
import { buildMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-fraunces",
  axes: ["opsz"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  ...buildMetadata({
    title: `${site.name} — Independent reviews, clearly reasoned`,
    description: site.description,
    path: "/",
  }),
  title: {
    default: `${site.name} — Independent reviews, clearly reasoned`,
    template: `%s | ${site.name}`,
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f4ea" },
    { media: "(prefers-color-scheme: dark)", color: "#231f19" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${fraunces.variable} ${inter.variable} font-sans antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <ThemeProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-3 focus:py-2 focus:rounded-sm"
          >
            Skip to content
          </a>
          <SiteHeader />
          <main id="main" className="flex-1 flex flex-col">
            {children}
          </main>
          <SiteFooter />
          <ConsentManager />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

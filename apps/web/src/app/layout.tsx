import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { PwaRegister } from "@/components/PwaRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ویلینک | یک لینک، همه چیز", template: "%s | ویلینک" },
  description: "پلتفرم لینک بیو فارسی برای فروشگاه‌های اینستاگرامی و کسب‌وکارهای ایرانی. بدون کارمزد فروش، با پشتیبانی بله، ایتا و روبیکا.",
  keywords: ["لینک بیو", "فروشگاه اینستاگرام", "بیولینک", "weeelink", "ویلینک"],
  metadataBase: new URL("https://weeelink.ir"),
  icons: {
    icon: [
      { url: "/weeelink.svg?v=8", type: "image/svg+xml" },
      { url: "/icons/icon-32.png?v=8", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-16.png?v=8", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=8",
    apple: { url: "/apple-touch-icon.png?v=8", sizes: "180x180", type: "image/png" },
  },
  openGraph: {
    siteName: "ویلینک",
    locale: "fa_IR",
    type: "website",
  },
};

// Static pages default to a 1-year CDN cache (s-maxage) with no way to purge
// on deploy since weeelink.ir sits behind a third-party CDN (ArvanCloud), not
// Vercel's own auto-invalidating edge. Bound staleness to 1 hour instead.
export const revalidate = 3600;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/Vazirmatn.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <meta name="theme-color" content="#0EA88A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="ویلینک" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="font-vazir antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: { fontFamily: "Vazirmatn, sans-serif", direction: "rtl" },
            }}
          />
        </ThemeProvider>
        <PwaRegister />
      </body>
    </html>
  );
}

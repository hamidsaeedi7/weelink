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
  openGraph: {
    siteName: "ویلینک",
    locale: "fa_IR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="icon" href="/weeelink.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#F97316" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/weeelink.svg" />
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

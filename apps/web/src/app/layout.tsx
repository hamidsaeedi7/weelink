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
      { url: "/weeelink.svg", type: "image/svg+xml" },
      { url: "/icons/icon-32.png?v=6", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-16.png?v=6", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=6",
    apple: { url: "/apple-touch-icon.png?v=5", sizes: "180x180", type: "image/png" },
  },
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
        <meta name="theme-color" content="#F97316" />
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

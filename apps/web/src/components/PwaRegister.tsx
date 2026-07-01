"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

export function PwaRegister() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [bannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(console.error);

      // Reload once when a new SW version activates so users see updated content
      navigator.serviceWorker.addEventListener("message", (e) => {
        if (e.data?.type === "SW_UPDATED") window.location.reload();
      });
    }

    const dismissed = sessionStorage.getItem("pwa-banner-dismissed");
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setBannerVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setBannerVisible(false);
  };

  const handleDismiss = () => {
    setBannerVisible(false);
    sessionStorage.setItem("pwa-banner-dismissed", "1");
  };

  if (!bannerVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
      <div
        className="pointer-events-auto w-full max-w-sm bg-[#0D0D18] border border-white/10
                   rounded-2xl shadow-2xl flex items-center gap-3 p-4"
        role="banner"
      >
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
          <img src="/weeelink.png" alt="ویلینک" className="w-6 h-6 rounded-lg" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">نصب اپ ویلینک</p>
          <p className="text-xs text-gray-400 mt-0.5">دسترسی سریع از صفحه اصلی گوشی</p>
        </div>

        <button
          onClick={handleInstall}
          className="shrink-0 flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600
                     text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          نصب
        </button>

        <button
          onClick={handleDismiss}
          className="shrink-0 text-gray-500 hover:text-gray-300 transition-colors p-1"
          aria-label="بستن"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

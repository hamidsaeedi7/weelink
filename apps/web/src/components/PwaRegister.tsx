"use client";

import { useEffect, useState } from "react";
import { X, Download, Share, PlusSquare } from "lucide-react";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function PwaRegister() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [iosGuideVisible, setIosGuideVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(console.error);

      // Reload once when a new SW version activates so users see updated content
      navigator.serviceWorker.addEventListener("message", (e) => {
        if (e.data?.type === "SW_UPDATED") window.location.reload();
      });
    }

    // اگر قبلاً نصب شده، هیچ بنری نشان نده
    if (isStandalone()) return;

    // بنر نصب فقط در دسکتاپ نمایش داده می‌شود — در موبایل/تبلت مزاحم است
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches && !isIos();
    if (!isDesktop) return;

    const onInstalled = () => {
      setBannerVisible(false);
      setInstalling(false);
      localStorage.setItem("pwa-installed", "1");
    };
    window.addEventListener("appinstalled", onInstalled);

    const dismissed = sessionStorage.getItem("pwa-banner-dismissed");

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      if (!dismissed) setBannerVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (isIos()) {
      setIosGuideVisible(true);
      return;
    }
    if (!installPrompt) return;
    setInstalling(true);
    try {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") {
        setBannerVisible(false);
      }
      // پرامپت فقط یک‌بار قابل استفاده است
      setInstallPrompt(null);
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setBannerVisible(false);
    setIosGuideVisible(false);
    sessionStorage.setItem("pwa-banner-dismissed", "1");
  };

  if (!bannerVisible) return null;

  return (
    <>
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
            disabled={installing}
            className="shrink-0 flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600
                       disabled:opacity-60 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
          >
            {installing ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
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

      {/* راهنمای نصب در iOS */}
      {iosGuideVisible && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center p-4"
          onClick={() => setIosGuideVisible(false)}
        >
          <div
            className="w-full max-w-sm bg-[#0D0D18] border border-white/10 rounded-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-base font-bold text-white">نصب در آیفون</p>
              <button onClick={() => setIosGuideVisible(false)} className="text-gray-500 hover:text-gray-300 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <ol className="space-y-3 text-sm text-gray-300">
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold flex items-center justify-center shrink-0">۱</span>
                <span className="flex items-center gap-1.5 flex-wrap">
                  در نوار پایین Safari روی دکمه
                  <Share className="w-4 h-4 text-blue-400 inline" />
                  (Share) بزنید
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold flex items-center justify-center shrink-0">۲</span>
                <span className="flex items-center gap-1.5 flex-wrap">
                  گزینه
                  <PlusSquare className="w-4 h-4 inline" />
                  «Add to Home Screen» را انتخاب کنید
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold flex items-center justify-center shrink-0">۳</span>
                <span>روی «Add» بزنید — آیکون ویلینک به صفحه اصلی اضافه می‌شود</span>
              </li>
            </ol>
          </div>
        </div>
      )}
    </>
  );
}

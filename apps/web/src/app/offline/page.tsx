"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0F] px-4 text-center">
      <img src="/weeelink.png" alt="ویلینک" className="w-16 h-16 mb-6 opacity-80" />
      <h1 className="text-2xl font-black text-white mb-3">اتصال اینترنت ندارید</h1>
      <p className="text-gray-400 text-sm mb-8 max-w-xs leading-relaxed">
        برای استفاده از ویلینک به اینترنت نیاز دارید. لطفاً اتصال خود را بررسی کنید.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors">
        تلاش مجدد
      </button>
    </div>
  );
}

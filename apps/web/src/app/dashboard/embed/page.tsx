"use client";

import { useEffect, useState, useRef } from "react";
import { shopsApi } from "@/lib/api";

type EmbedType = "iframe" | "floating" | "link-button";
type Position = "bottom-right" | "bottom-left" | "bottom-center";
type ButtonColor = "orange" | "black" | "custom";

export default function EmbedPage() {
  const [slug, setSlug] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Customization
  const [embedType, setEmbedType] = useState<EmbedType>("iframe");
  const [width, setWidth] = useState(480);
  const [height, setHeight] = useState(700);
  const [position, setPosition] = useState<Position>("bottom-right");
  const [buttonText, setButtonText] = useState("مشاهده فروشگاه");
  const [buttonColor, setButtonColor] = useState<ButtonColor>("orange");
  const [customColor, setCustomColor] = useState("#ff6b00");

  // Preview modal
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const shopUrl = `https://weeelink.com/${slug}`;

  const resolvedColor =
    buttonColor === "orange"
      ? "#ff6b00"
      : buttonColor === "black"
      ? "#111111"
      : customColor;

  useEffect(() => {
    shopsApi.getMine().then((shop: any) => {
      setSlug(shop?.slug ?? "");
      setLoading(false);
    });
  }, []);

  // ── Code generators ──────────────────────────────────────────────────────────

  const iframeCode = `<iframe
  src="${shopUrl}"
  width="${width}"
  height="${height}"
  style="border: none; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.12);"
  loading="lazy"
  title="فروشگاه ویلینک"
></iframe>`;

  const positionStyle: Record<Position, string> = {
    "bottom-right": "bottom: 24px; right: 24px;",
    "bottom-left": "bottom: 24px; left: 24px;",
    "bottom-center":
      "bottom: 24px; left: 50%; transform: translateX(-50%);",
  };

  const floatingCode = `<!-- Weelink Floating Button -->
<div id="weelink-widget"></div>
<script>
(function() {
  var btn = document.createElement('button');
  btn.innerText = '${buttonText}';
  btn.style.cssText = 'position:fixed;${positionStyle[position]}z-index:9999;padding:14px 22px;background:${resolvedColor};color:#fff;border:none;border-radius:50px;font-family:inherit;font-size:15px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.2);direction:rtl;';

  var modal = document.createElement('div');
  modal.style.cssText = 'display:none;position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.6);align-items:center;justify-content:center;';
  modal.innerHTML = '<div style="position:relative;background:#fff;border-radius:16px;overflow:hidden;width:${width}px;height:${height}px;max-width:95vw;max-height:90vh;"><button onclick="this.closest(\\'div\\').parentElement.style.display=\\'none\\'" style="position:absolute;top:8px;left:8px;z-index:1;background:#fff;border:none;border-radius:50%;width:32px;height:32px;font-size:18px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.15);">×</button><iframe src="${shopUrl}" style="width:100%;height:100%;border:none;" loading="lazy"></iframe></div>';

  btn.onclick = function() { modal.style.display = 'flex'; };
  modal.onclick = function(e) { if (e.target === modal) modal.style.display = 'none'; };

  document.body.appendChild(btn);
  document.body.appendChild(modal);
})();
</script>`;

  const linkButtonCode = `<a
  href="${shopUrl}"
  target="_blank"
  rel="noopener noreferrer"
  style="display:inline-block;padding:14px 28px;background:${resolvedColor};color:#fff;text-decoration:none;border-radius:50px;font-family:inherit;font-size:15px;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,0.15);direction:rtl;"
>${buttonText}</a>`;

  const codeMap: Record<EmbedType, string> = {
    iframe: iframeCode,
    floating: floatingCode,
    "link-button": linkButtonCode,
  };

  const currentCode = codeMap[embedType];

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" dir="rtl">
      <h1 className="text-2xl font-bold mb-2">ابزار امبد ویجت</h1>
      <p className="text-gray-500 mb-8 text-sm">
        کد زیر را در وب‌سایت، بلاگ یا صفحه لندینگ خود جای‌گذاری کنید.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Settings Panel ── */}
        <div className="space-y-6 bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          {/* Embed type */}
          <div>
            <label className="block text-sm font-semibold mb-3">نوع امبد</label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { key: "iframe", label: "iFrame" },
                  { key: "floating", label: "دکمه شناور" },
                  { key: "link-button", label: "لینک دکمه" },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setEmbedType(key)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    embedType === key
                      ? "bg-accent-500 text-white border-accent-500"
                      : "border-gray-200 dark:border-gray-600 hover:border-accent-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Width slider */}
          {embedType !== "link-button" && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  عرض: <span className="text-accent-500">{width}px</span>
                </label>
                <input
                  type="range"
                  min={300}
                  max={800}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="w-full accent-accent-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>300px</span>
                  <span>800px</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  ارتفاع: <span className="text-accent-500">{height}px</span>
                </label>
                <input
                  type="range"
                  min={400}
                  max={1000}
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full accent-accent-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>400px</span>
                  <span>1000px</span>
                </div>
              </div>
            </>
          )}

          {/* Floating position */}
          {embedType === "floating" && (
            <div>
              <label className="block text-sm font-semibold mb-3">موقعیت دکمه</label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { key: "bottom-right", label: "راست پایین" },
                    { key: "bottom-center", label: "مرکز پایین" },
                    { key: "bottom-left", label: "چپ پایین" },
                  ] as const
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setPosition(key)}
                    className={`py-2 px-2 rounded-lg text-xs font-medium border transition-colors ${
                      position === key
                        ? "bg-accent-500 text-white border-accent-500"
                        : "border-gray-200 dark:border-gray-600 hover:border-accent-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Button text */}
          {(embedType === "floating" || embedType === "link-button") && (
            <div>
              <label className="block text-sm font-semibold mb-2">متن دکمه</label>
              <input
                type="text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-accent-300"
              />
            </div>
          )}

          {/* Button color */}
          {(embedType === "floating" || embedType === "link-button") && (
            <div>
              <label className="block text-sm font-semibold mb-3">رنگ دکمه</label>
              <div className="flex gap-3 items-center">
                {(["orange", "black", "custom"] as ButtonColor[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setButtonColor(c)}
                    title={c === "orange" ? "نارنجی" : c === "black" ? "مشکی" : "دلخواه"}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      buttonColor === c ? "scale-110 border-accent-400" : "border-transparent"
                    }`}
                    style={{
                      background:
                        c === "orange"
                          ? "#ff6b00"
                          : c === "black"
                          ? "#111"
                          : customColor,
                    }}
                  />
                ))}
                {buttonColor === "custom" && (
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-gray-200"
                  />
                )}
              </div>
            </div>
          )}

          {/* Live preview button */}
          {embedType === "iframe" && (
            <button
              onClick={() => setShowPreview(true)}
              className="w-full py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium transition-colors"
            >
              پیش‌نمایش زنده
            </button>
          )}
        </div>

        {/* ── Code Panel ── */}
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-lg">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-800">
              <span className="text-gray-400 text-xs font-mono">
                {embedType === "iframe"
                  ? "HTML / iFrame"
                  : embedType === "floating"
                  ? "JavaScript Snippet"
                  : "HTML / Link Button"}
              </span>
              <button
                onClick={() => handleCopy("main", currentCode)}
                className="flex items-center gap-1.5 text-xs bg-accent-500 hover:bg-accent-600 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                {copied === "main" ? "✓ کپی شد" : "کپی کد"}
              </button>
            </div>
            <pre className="text-green-400 text-xs p-4 overflow-auto max-h-80 leading-relaxed font-mono whitespace-pre-wrap break-all">
              {currentCode}
            </pre>
          </div>

          {/* Link in bio snippet */}
          <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-lg">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-800">
              <span className="text-gray-400 text-xs font-mono">لینک در بیو (Instagram Bio)</span>
              <button
                onClick={() => handleCopy("bio", linkButtonCode)}
                className="flex items-center gap-1.5 text-xs bg-accent-500 hover:bg-accent-600 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                {copied === "bio" ? "✓ کپی شد" : "کپی کد"}
              </button>
            </div>
            <pre className="text-green-400 text-xs p-4 overflow-auto max-h-40 leading-relaxed font-mono whitespace-pre-wrap break-all">
              {linkButtonCode}
            </pre>
          </div>

          {/* Live button preview */}
          {(embedType === "floating" || embedType === "link-button") && (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-400 mb-4 font-medium">پیش‌نمایش دکمه</p>
              <div className="flex justify-center">
                <button
                  style={{ background: resolvedColor }}
                  className="text-white px-6 py-3 rounded-full text-sm font-semibold shadow-lg"
                >
                  {buttonText}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Preview Modal ── */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowPreview(false)}
        >
          <div
            className="bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-hidden shadow-2xl relative"
            style={{ width: Math.min(width, window.innerWidth - 32), height: Math.min(height, window.innerHeight - 80) }}
          >
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-3 left-3 z-10 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-lg font-bold shadow"
            >
              ×
            </button>
            <iframe
              src={shopUrl}
              className="w-full h-full border-none"
              title="پیش‌نمایش فروشگاه"
            />
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Download, Copy, ExternalLink, QrCode, Loader2, ImageIcon, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { shopsApi } from "@/lib/api";

const QR_SIZES = [200, 300, 400, 600];

const QR_STYLES = [
  { id: "classic",  fg: "#000000", bg: "#FFFFFF", label: "کلاسیک",   textColor: "#000" },
  { id: "dark",     fg: "#F97316", bg: "#0A0A0F", label: "ویلینک",   textColor: "#F97316" },
  { id: "soft",     fg: "#111827", bg: "#FFF7ED", label: "ملایم",    textColor: "#111827" },
  { id: "purple",   fg: "#7C3AED", bg: "#F5F3FF", label: "بنفش",     textColor: "#7C3AED" },
  { id: "blue",     fg: "#1D4ED8", bg: "#EFF6FF", label: "آبی",      textColor: "#1D4ED8" },
  { id: "green",    fg: "#15803D", bg: "#F0FDF4", label: "سبز",      textColor: "#15803D" },
];

function buildQrApiUrl(text: string, fg: string, bg: string, size: number) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&color=${fg.replace("#", "")}&bgcolor=${bg.replace("#", "")}&margin=20&format=png&qzone=1`;
}

export default function QrCodePage() {
  const [slug, setSlug]           = useState("");
  const [shopName, setShopName]   = useState("");
  const [loading, setLoading]     = useState(true);
  const [styleIdx, setStyleIdx]   = useState(0);
  const [size, setSize]           = useState(300);
  const [withLogo, setWithLogo]   = useState(true);
  const [frame, setFrame]         = useState<"none" | "simple" | "scan">("simple");
  const [downloading, setDownloading] = useState(false);
  const [qrLoaded, setQrLoaded]   = useState(false);

  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (shopsApi.getMine() as Promise<any>)
      .then((shop) => { setSlug(shop?.slug || ""); setShopName(shop?.name || ""); })
      .finally(() => setLoading(false));
  }, []);

  const style   = QR_STYLES[styleIdx];
  const pageUrl = `https://weeelink.com/${slug}`;
  const qrUrl   = slug ? buildQrApiUrl(pageUrl, style.fg, style.bg, size) : "";

  /* ── Render QR + logo onto canvas ─────────────────────────── */
  const renderToCanvas = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    const canvas = document.createElement("canvas");
    const PADDING = frame !== "none" ? 48 : 0;
    const FOOTER  = frame === "scan" ? 64 : frame === "simple" ? 40 : 0;
    canvas.width  = size + PADDING * 2;
    canvas.height = size + PADDING * 2 + FOOTER;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Background
    ctx.fillStyle = style.bg;
    if (frame !== "none") {
      const r = 24;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(canvas.width - r, 0);
      ctx.arcTo(canvas.width, 0, canvas.width, r, r);
      ctx.lineTo(canvas.width, canvas.height - r);
      ctx.arcTo(canvas.width, canvas.height, canvas.width - r, canvas.height, r);
      ctx.lineTo(r, canvas.height);
      ctx.arcTo(0, canvas.height, 0, canvas.height - r, r);
      ctx.lineTo(0, r);
      ctx.arcTo(0, 0, r, 0, r);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // QR Code
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(img, PADDING, PADDING, size, size);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = qrUrl;
    });

    // Logo overlay
    if (withLogo) {
      const LOGO_SIZE = Math.round(size * 0.18);
      const lx = PADDING + (size - LOGO_SIZE) / 2;
      const ly = PADDING + (size - LOGO_SIZE) / 2;

      // White bg behind logo
      const pad = 6;
      ctx.fillStyle = style.bg;
      ctx.beginPath();
      ctx.roundRect(lx - pad, ly - pad, LOGO_SIZE + pad * 2, LOGO_SIZE + pad * 2, 10);
      ctx.fill();

      await new Promise<void>((resolve) => {
        const logo = new Image();
        logo.onload = () => {
          ctx.drawImage(logo, lx, ly, LOGO_SIZE, LOGO_SIZE);
          resolve();
        };
        logo.onerror = () => resolve();
        logo.src = "/weeelink.png";
      });
    }

    // Frame text
    if (frame !== "none") {
      const cy = size + PADDING + (FOOTER / 2);
      ctx.fillStyle = style.fg;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (frame === "scan") {
        ctx.font = `bold ${size * 0.05}px Vazirmatn, sans-serif`;
        ctx.fillText("📷 اسکن کن، وارد شو", canvas.width / 2, cy - 10);
        ctx.font = `${size * 0.035}px Vazirmatn, sans-serif`;
        ctx.fillStyle = style.fg + "99";
        ctx.fillText(pageUrl, canvas.width / 2, cy + 16);
      } else {
        ctx.font = `bold ${size * 0.04}px Vazirmatn, sans-serif`;
        ctx.fillText("weeelink.com/" + slug, canvas.width / 2, cy);
      }
    }

    return canvas;
  }, [qrUrl, size, style, withLogo, frame, slug, pageUrl]);

  /* ── Download ──────────────────────────────────────────────── */
  const download = async () => {
    setDownloading(true);
    try {
      const canvas = await renderToCanvas();
      if (!canvas) throw new Error("خطا در رندر");
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `weelink-qr-${slug}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success("QR Code دانلود شد");
      }, "image/png");
    } catch {
      toast.error("خطا در دانلود");
    } finally {
      setDownloading(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(pageUrl);
    toast.success("لینک کپی شد");
  };

  const downloadVCard = () => {
    const vcf = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${shopName || slug}`,
      `URL:${pageUrl}`,
      `NOTE:صفحه بیو ویلینک`,
      "END:VCARD",
    ].join("\r\n");
    const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${slug}.vcf`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("کارت ویزیت دانلود شد");
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-accent" />
    </div>
  );

  if (!slug) return (
    <div className="text-center py-16 text-gray-400">
      <QrCode className="w-12 h-12 mx-auto mb-3 opacity-20" />
      <p>ابتدا فروشگاه خود را ایجاد کنید</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900 dark:text-white">QR Code</h1>
        <p className="text-sm text-gray-500 mt-1">کد QR اختصاصی صفحه بیو با لوگو</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* ── Preview ─────────────────────────────── */}
        <div className="glass-card p-6 flex flex-col items-center gap-5">
          <div
            ref={previewRef}
            className="relative rounded-2xl overflow-hidden shadow-xl"
            style={{
              background: style.bg,
              padding: frame !== "none" ? "16px" : "0",
            }}
          >
            {/* QR image */}
            <img
              key={qrUrl}
              src={qrUrl}
              alt="QR Code"
              width={240}
              height={240}
              className="block rounded-xl"
              style={{ display: "block" }}
              onLoad={() => setQrLoaded(true)}
            />

            {/* Logo overlay */}
            {withLogo && qrLoaded && (
              <div
                className="absolute rounded-xl overflow-hidden shadow-md"
                style={{
                  width: 240 * 0.18,
                  height: 240 * 0.18,
                  left: "50%",
                  top: frame !== "none" ? "calc(50% - 10px)" : "50%",
                  transform: "translate(-50%, -50%)",
                  background: style.bg,
                  padding: 3,
                }}
              >
                <img src="/weeelink.png" alt="logo" className="w-full h-full object-contain rounded-lg" />
              </div>
            )}

            {/* Frame caption */}
            {frame === "simple" && (
              <p
                className="text-center text-[11px] font-bold mt-2 pb-1"
                style={{ color: style.fg }}
              >
                weeelink.com/{slug}
              </p>
            )}
            {frame === "scan" && (
              <div className="text-center mt-2 pb-1 space-y-0.5">
                <p className="text-xs font-bold" style={{ color: style.fg }}>
                  📷 اسکن کن، وارد شو
                </p>
                <p className="text-[10px] opacity-60" style={{ color: style.fg }}>
                  {pageUrl}
                </p>
              </div>
            )}
          </div>

          {/* URL */}
          <div className="text-center">
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{pageUrl}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 w-full">
            <button onClick={copyUrl}
              className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-xl text-xs font-bold
                         border border-gray-200 dark:border-white/10
                         text-gray-600 dark:text-gray-300 hover:border-accent hover:text-accent transition-all">
              <Copy className="w-3.5 h-3.5" />
              کپی لینک
            </button>
            <a href={`/${slug}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-xl text-xs font-bold
                         border border-gray-200 dark:border-white/10
                         text-gray-600 dark:text-gray-300 hover:border-accent hover:text-accent transition-all">
              <ExternalLink className="w-3.5 h-3.5" />
              باز کردن
            </a>
            <button onClick={download} disabled={downloading}
              className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-xl text-xs font-bold
                         text-white transition-all disabled:opacity-60 btn-primary">
              {downloading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Download className="w-3.5 h-3.5" />}
              دانلود
            </button>
          </div>
        </div>

        {/* ── Settings ─────────────────────────────── */}
        <div className="space-y-4">

          {/* Logo toggle */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-4 h-4 text-accent" />
                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">لوگوی ویلینک</p>
                  <p className="text-xs text-gray-500">نمایش لوگو در مرکز QR</p>
                </div>
              </div>
              <button
                onClick={() => setWithLogo(!withLogo)}
                className={`relative w-11 h-6 rounded-full transition-all duration-200 ${
                  withLogo ? "bg-accent" : "bg-gray-300 dark:bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${
                    withLogo ? "right-0.5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Style */}
          <div className="glass-card p-4 space-y-3">
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">رنگ‌بندی</p>
            <div className="grid grid-cols-3 gap-2">
              {QR_STYLES.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => { setStyleIdx(i); setQrLoaded(false); }}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${
                    styleIdx === i
                      ? "border-accent shadow-sm"
                      : "border-transparent hover:border-gray-200 dark:hover:border-white/10"
                  }`}
                  style={{ background: s.bg }}
                >
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-sm" style={{ background: s.fg }} />
                    <div className="w-3 h-3 rounded-sm opacity-40" style={{ background: s.fg }} />
                  </div>
                  <span className="text-[10px] font-bold" style={{ color: s.textColor }}>
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Frame */}
          <div className="glass-card p-4 space-y-3">
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">قاب</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "none",   label: "بدون قاب" },
                { id: "simple", label: "آدرس ساده" },
                { id: "scan",   label: "اسکن کن!" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFrame(f.id as typeof frame)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    frame === f.id
                      ? "text-white border-accent"
                      : "border-gray-200 dark:border-white/10 text-gray-500 hover:border-accent/40"
                  }`}
                  style={frame === f.id ? { backgroundColor: "var(--accent)" } : {}}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="glass-card p-4 space-y-3">
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">اندازه دانلود</p>
            <div className="grid grid-cols-4 gap-2">
              {QR_SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => { setSize(s); setQrLoaded(false); }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    size === s
                      ? "text-white border-accent"
                      : "border-gray-200 dark:border-white/10 text-gray-500 hover:border-accent/40"
                  }`}
                  style={size === s ? { backgroundColor: "var(--accent)" } : {}}
                >
                  {s}px
                </button>
              ))}
            </div>
          </div>

          {/* vCard */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-accent" />
                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">کارت ویزیت دیجیتال</p>
                  <p className="text-xs text-gray-500">دانلود فایل vCard برای ذخیره در مخاطبان</p>
                </div>
              </div>
              <button onClick={downloadVCard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
                           border border-gray-200 dark:border-white/10
                           text-gray-600 dark:text-gray-300 hover:border-accent hover:text-accent transition-all">
                <Download className="w-3.5 h-3.5" />
                vcf.
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* hidden canvas for render */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

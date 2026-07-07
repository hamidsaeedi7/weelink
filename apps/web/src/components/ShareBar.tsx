"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "./blocks/brand-icons";

// دکمهٔ «کپی لینک» + اشتراک‌گذاری در تلگرام/واتساپ/ایتا/بله/روبیکا
export function ShareBar({ url, text = "صفحهٔ من در ویلینک" }: { url: string; text?: string }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("لینک کپی شد");
      setTimeout(() => setCopied(false), 1500);
    } catch { toast.error("کپی نشد"); }
  };

  const targets: { id: string; label: string; href?: string }[] = [
    { id: "telegram", label: "تلگرام", href: `https://t.me/share/url?url=${u}&text=${t}` },
    { id: "whatsapp", label: "واتساپ", href: `https://wa.me/?text=${t}%20${u}` },
    { id: "eitaa", label: "ایتا", href: `https://eitaa.com/share/url?url=${u}&text=${t}` },
    { id: "bale", label: "بله", href: `https://bale.ai/share/url?url=${u}&text=${t}` },
    { id: "rubika", label: "روبیکا" }, // روبیکا share URL عمومی ندارد → کپی می‌کنیم
  ];

  const share = (tg: { id: string; href?: string }) => {
    if (tg.href) window.open(tg.href, "_blank", "noopener,noreferrer");
    else { copy(); toast.message("لینک کپی شد — در روبیکا برای مخاطب پیست کنید"); }
    setOpen(false);
  };

  return (
    <div className="relative flex items-center gap-2">
      <button
        onClick={copy}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm
                   border border-gray-200 dark:border-white/10
                   text-gray-600 dark:text-gray-400 hover:border-accent-500/50 hover:text-accent-500 transition-all">
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        کپی لینک
      </button>

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm
                   border border-gray-200 dark:border-white/10
                   text-gray-600 dark:text-gray-400 hover:border-accent-500/50 hover:text-accent-500 transition-all">
        <Share2 className="w-4 h-4" />
        اشتراک
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-2 z-50 flex gap-2 p-2 rounded-2xl
                          bg-gray-100 dark:bg-[#141422] border border-gray-200 dark:border-white/10 shadow-xl">
            {targets.map((tg) => (
              <button key={tg.id} onClick={() => share(tg)} title={tg.label}
                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                <BrandLogo platform={tg.id} size={26} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

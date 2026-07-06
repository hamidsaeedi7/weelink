"use client";

import { useRef, useState, useEffect } from "react";

interface Props {
  src: string;
  poster?: string;
  watermarkText?: string;
  watermarkColor?: string;
  watermarkCount?: number;
}

// پخش‌کنندهٔ امن: واترمارک متحرک + بازدارندهٔ دانلود/راست‌کلیک/PiP.
// نکته: ضبط صفحه در سطح سیستم‌عامل قابل جلوگیری کامل نیست؛ این‌ها کپی را سخت می‌کنند.
export function SecureVideoPlayer({
  src,
  poster,
  watermarkText,
  watermarkColor = "#ffffff",
  watermarkCount = 3,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: "40%", left: "30%" });

  // واترمارک متحرک — هر چند ثانیه جای اصلی جابه‌جا می‌شود (سخت‌تر برای حذف)
  useEffect(() => {
    if (!watermarkText) return;
    const id = setInterval(() => {
      setPos({ top: `${10 + Math.random() * 75}%`, left: `${5 + Math.random() * 75}%` });
    }, 4000);
    return () => clearInterval(id);
  }, [watermarkText]);

  const count = Math.max(1, Math.min(8, watermarkCount || 3));
  const staticMarks = Array.from({ length: count - 1 }, (_, i) => ({
    top: `${15 + (i * 65) / Math.max(1, count - 2 || 1)}%`,
    left: `${(i % 2 === 0 ? 12 : 58)}%`,
  }));

  return (
    <div
      ref={wrapRef}
      className="relative w-full rounded-2xl overflow-hidden bg-black select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <video
        src={src}
        poster={poster}
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full block"
        style={{ maxHeight: "70vh" }}
      />

      {/* watermark overlay (pointer-events off so it never blocks controls) */}
      {watermarkText && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* moving primary mark */}
          <span
            className="absolute text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-1000"
            style={{ top: pos.top, left: pos.left, color: watermarkColor, opacity: 0.35, textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
          >
            {watermarkText}
          </span>
          {/* extra static marks */}
          {staticMarks.map((m, i) => (
            <span
              key={i}
              className="absolute text-xs font-bold whitespace-nowrap"
              style={{ top: m.top, left: m.left, color: watermarkColor, opacity: 0.18, textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
            >
              {watermarkText}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

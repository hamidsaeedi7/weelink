"use client";

import type { Background, CanvasSize, Page } from "@/lib/editor/types";

export function backgroundCss(bg: Background): string {
  if (bg.type === "solid") return bg.color;
  if (bg.type === "gradient") return `linear-gradient(${bg.angle}deg, ${bg.from}, ${bg.to})`;
  return "#111";
}

const DEFAULT_CANVAS: CanvasSize = { width: 1080, height: 1920 };

/**
 * A DOM approximation of a page, used for every thumbnail in the app
 * (templates, generated product stories).
 *
 * Deliberately not a Konva stage: a grid of a dozen live stages costs far
 * more than a preview is worth. Sizing is done in container-query units so
 * one component works at any thumbnail size, and every dimension is a true
 * proportion of the canvas so the preview cannot drift from the real render.
 */
export function PagePreview({
  page,
  canvas = DEFAULT_CANVAS,
}: {
  page: Page;
  canvas?: CanvasSize;
}) {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: backgroundCss(page.background), containerType: "size" }}
    >
      {page.objects.map((o) => {
        if (!o.visible) return null;
        const base: React.CSSProperties = {
          position: "absolute",
          left: `${(o.x / canvas.width) * 100}%`,
          top: `${(o.y / canvas.height) * 100}%`,
          width: `${(o.width / canvas.width) * 100}%`,
          height: `${(o.height / canvas.height) * 100}%`,
          opacity: o.opacity,
          transform: o.rotation ? `rotate(${o.rotation}deg)` : undefined,
        };

        if (o.type === "text") {
          return (
            <div
              key={o.id}
              style={{
                ...base,
                color: o.fill,
                // 1cqh == 1% of the preview's height, so a font size expressed
                // as a share of canvas height scales exactly with the thumbnail.
                fontSize: `${(o.fontSize / canvas.height) * 100}cqh`,
                fontFamily: o.fontFamily,
                fontWeight: o.fontWeight,
                textAlign: o.align,
                direction: o.direction,
                lineHeight: o.lineHeight,
                textDecoration: o.textDecoration === "line-through" ? "line-through" : undefined,
                overflow: "hidden",
                whiteSpace: "pre-wrap",
              }}
            >
              {o.text}
            </div>
          );
        }

        if (o.type === "shape") {
          const isStrokeOnly = o.fill === "rgba(0,0,0,0)" || o.fill === "transparent";
          return (
            <div
              key={o.id}
              style={{
                ...base,
                background: isStrokeOnly ? "transparent" : o.fill,
                border: o.stroke ? `1px solid ${o.stroke}` : undefined,
                borderRadius:
                  o.shape === "ellipse" ? "50%" : `${((o.cornerRadius ?? 0) / canvas.width) * 100}%`,
              }}
            />
          );
        }

        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={o.id}
            src={o.src}
            alt=""
            style={{
              ...base,
              objectFit: "cover",
              borderRadius: `${(o.cornerRadius / canvas.width) * 100}%`,
            }}
          />
        );
      })}
    </div>
  );
}

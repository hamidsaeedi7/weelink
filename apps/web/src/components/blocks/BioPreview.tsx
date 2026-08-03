"use client";

import { BlockRenderer } from "./BlockRenderer";
import { BioContextProvider } from "./SiteBlocks";
import { resolveBioBackground, isAtmospheric } from "@/lib/bio-theme";

/**
 * A live, interactive render of the seller's public page from in-memory data.
 *
 * The block list is rendered by the very same `BlockRenderer` the public page
 * uses, under the same `data-bio-theme`/`data-bio-mode` root, so what the
 * seller sees here cannot drift from what a visitor sees. Only the profile
 * header is repeated (it is static markup that does not change while
 * editing); everything that changes is shared code.
 */

interface Props {
  shop: any;
  blocks: any[];
  /** highlights the block being edited */
  selectedId?: string | null;
  /** click-to-edit: fires with a block id instead of following its link */
  onSelect?: (id: string) => void;
  /** demo products for PRODUCT_GRID blocks in `auto` mode */
  products?: any[];
  className?: string;
}

const BENTO_WIDE = new Set([
  "FEATURED", "IMAGE", "VIDEO", "MAP", "EMAIL_CAPTURE", "FAQ",
  "ORDER_FORM", "FLASH_SALE", "TEXT", "DIVIDER", "GROUP",
  "HERO", "TRUST_BAR", "CATEGORY_CHIPS", "PRODUCT_GRID", "GALLERY",
  "TESTIMONIAL", "STATS", "SOCIAL_ROW", "HOURS", "PRICE_LIST",
  "BUTTON_ROW", "BOTTOM_NAV",
]);

export function BioPreview({ shop, blocks, selectedId, onSelect, products = [], className = "" }: Props) {
  const primary = shop?.primaryColor || "#0EA88A";
  const theme = shop?.bioTheme || "modern";
  const mode = shop?.bioMode || "dark";
  const isBento = theme === "bento";
  const visible = blocks.filter((b) => b.isActive !== false);

  return (
    <div
      data-bio-theme={theme}
      data-bio-mode={mode}
      className={`w-full min-h-full ${className}`}
      style={{
        background: resolveBioBackground(shop, theme),
        fontFamily: `'${shop?.fontFamily || "Vazirmatn"}', Vazirmatn, sans-serif`,
      }}
    >
      {shop?.bannerUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shop.bannerUrl} alt="" className="w-full h-24 object-cover" />
      )}

      <div className="px-4 pb-10">
        <div className="flex flex-col items-center pt-8 pb-5 space-y-2">
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 shadow-xl"
            style={{
              borderColor: `${primary}60`,
              boxShadow: isAtmospheric(theme) ? `0 0 20px ${primary}30` : "none",
            }}>
            {shop?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shop.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white"
                style={{ background: `linear-gradient(135deg, ${primary}, ${primary}88)` }}>
                {(shop?.name || "و")[0]}
              </div>
            )}
          </div>
          <h2 className="text-lg font-black" style={{ color: "var(--bio-text)" }}>{shop?.name || "فروشگاه من"}</h2>
          {shop?.bio && (
            <p className="text-xs text-center max-w-xs leading-relaxed" style={{ color: "var(--bio-text-secondary)" }}>
              {shop.bio}
            </p>
          )}
        </div>

        <BioContextProvider value={{ primaryColor: primary, slug: shop?.slug || "", products }}>
          <div className={isBento ? "grid grid-cols-2 gap-2.5" : "space-y-2.5"}>
            {visible.map((block) => (
              <div
                key={block.id}
                // Capture phase: stop the block's own <a> from navigating away
                // from the dashboard, and treat the click as "edit this block".
                onClickCapture={onSelect ? (e) => { e.preventDefault(); e.stopPropagation(); onSelect(block.id); } : undefined}
                className={[
                  isBento && !BENTO_WIDE.has(block.type) ? "col-span-1" : isBento ? "col-span-2" : "",
                  onSelect ? "relative cursor-pointer rounded-2xl transition-shadow" : "",
                  selectedId === block.id ? "ring-2 ring-offset-2 ring-offset-transparent" : "",
                ].join(" ")}
                style={selectedId === block.id ? { boxShadow: `0 0 0 2px ${primary}` , borderRadius: "var(--bio-radius)" } : undefined}
              >
                <BlockRenderer block={block} primaryColor={primary} />
              </div>
            ))}
          </div>
        </BioContextProvider>

        {visible.length === 0 && (
          <p className="text-center text-xs py-10" style={{ color: "var(--bio-text-secondary)" }}>
            هنوز بلوکی اضافه نکرده‌اید
          </p>
        )}
      </div>
    </div>
  );
}

/** Phone-shaped chrome around the preview, used in the desktop split view. */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-[22rem] max-w-full">
      <div className="relative rounded-[2.25rem] border-8 border-gray-900 dark:border-gray-800 bg-gray-900
                      shadow-2xl overflow-hidden">
        <div aria-hidden="true"
          className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-gray-900 rounded-b-2xl z-10" />
        <div className="h-[38rem] overflow-y-auto scrollbar-hide bg-white">{children}</div>
      </div>
    </div>
  );
}

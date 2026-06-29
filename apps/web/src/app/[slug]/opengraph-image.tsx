import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface ShopData {
  name?: string;
  bio?: string;
  logo?: string;
  slug?: string;
}

export default async function Image({ params }: { params: { slug: string } }) {
  let shop: ShopData = {};

  try {
    const res = await fetch(`${API}/api/v1/shops/public/${params.slug}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      shop = json.data || json;
    }
  } catch {
    // fallback to empty shop data
  }

  const name = shop.name || params.slug;
  const bio = shop.bio || "لینک بیو فارسی | weeelink.com";
  const logoUrl = shop.logo ? `${API}/uploads/${shop.logo}` : null;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0A0A0F 0%, #111827 100%)",
          padding: "60px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Decorative accent circle */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background: "rgba(249, 115, 22, 0.12)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            left: "-60px",
            width: "240px",
            height: "240px",
            borderRadius: "50%",
            background: "rgba(249, 115, 22, 0.08)",
            display: "flex",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            alignItems: "flex-end",
            gap: "24px",
            direction: "rtl",
          }}
        >
          {/* Logo */}
          {logoUrl && (
            <div
              style={{
                display: "flex",
                width: "96px",
                height: "96px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "3px solid #F97316",
              }}
            >
              <img
                src={logoUrl}
                alt={name}
                width={96}
                height={96}
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
              />
            </div>
          )}

          {/* Shop name */}
          <div
            style={{
              fontSize: "64px",
              fontWeight: "bold",
              color: "#F97316",
              textAlign: "right",
              lineHeight: 1.2,
              maxWidth: "900px",
            }}
          >
            {name}
          </div>

          {/* Bio */}
          <div
            style={{
              fontSize: "28px",
              color: "#D1D5DB",
              textAlign: "right",
              lineHeight: 1.6,
              maxWidth: "900px",
            }}
          >
            {bio}
          </div>
        </div>

        {/* Bottom branding bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(249, 115, 22, 0.3)",
            paddingTop: "24px",
            marginTop: "24px",
          }}
        >
          <div
            style={{
              fontSize: "20px",
              color: "#6B7280",
            }}
          >
            bio link platform
          </div>
          <div
            style={{
              fontSize: "22px",
              color: "#F97316",
              fontWeight: "bold",
            }}
          >
            ویلینک | weeelink.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
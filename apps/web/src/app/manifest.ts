import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "ویلینک",
    short_name: "ویلینک",
    description: "پلتفرم لینک بیو فارسی برای فروشگاه‌های اینستاگرامی و کسب‌وکارهای ایرانی",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0A0A0F",
    theme_color: "#F97316",
    orientation: "portrait",
    lang: "fa",
    dir: "rtl",
    prefer_related_applications: false,
    icons: [
      { src: "/icons/icon-72.png?v=7", sizes: "72x72", type: "image/png" },
      { src: "/icons/icon-96.png?v=7", sizes: "96x96", type: "image/png" },
      { src: "/icons/icon-128.png?v=7", sizes: "128x128", type: "image/png" },
      { src: "/icons/icon-144.png?v=7", sizes: "144x144", type: "image/png" },
      { src: "/icons/icon-152.png?v=7", sizes: "152x152", type: "image/png" },
      { src: "/icons/icon-192.png?v=7", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192-maskable.png?v=7", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-384.png?v=7", sizes: "384x384", type: "image/png" },
      { src: "/icons/icon-512.png?v=7", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512-maskable.png?v=7", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [
      {
        src: "/screenshots/mobile.png",
        sizes: "1080x1920",
        type: "image/png",
        // @ts-ignore
        form_factor: "narrow",
        label: "صفحه اصلی ویلینک",
      },
      {
        src: "/screenshots/wide.png",
        sizes: "1280x720",
        type: "image/png",
        // @ts-ignore
        form_factor: "wide",
        label: "ویلینک — لینک بیو فارسی",
      },
    ],
    categories: ["productivity", "social"],
  };
}

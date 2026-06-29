import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/api/", "/payment/", "/onboarding"],
      },
    ],
    sitemap: "https://weeelink.com/sitemap.xml",
  };
}

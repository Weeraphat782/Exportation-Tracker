import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = absoluteUrl("");
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/public/"],
        disallow: [
          "/api/",
          "/admin/",
          "/cms/",
          "/portal/",
          "/track/",
          "/simple-login/",
          "/preview/",
          "/internal/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
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
  };
}

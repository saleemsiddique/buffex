import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/consent/privacy", "/consent/terms", "/consent/cookies"],
        disallow: [
          "/auth/",
          "/profile/",
          "/kitchen/",
          "/return",
          "/consent/gestion-consentimientos",
          "/newsletter-unsuscribe",
          "/api/",
        ],
      },
    ],
    sitemap: "https://buffex.io/sitemap.xml",
  };
}

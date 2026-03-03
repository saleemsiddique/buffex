import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://buffex.io";
  return [
    { url: base,                         lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/consent/privacy`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/consent/terms`,      lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/consent/cookies`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];
}

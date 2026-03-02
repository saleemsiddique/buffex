import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = "https://buffex.io";

  const routes = [
    { path: "", priority: "1.0", changefreq: "weekly" },
    { path: "kitchen", priority: "0.9", changefreq: "monthly" },
    { path: "kitchen/recipes/list", priority: "0.8", changefreq: "monthly" },
    { path: "consent/privacy", priority: "0.5", changefreq: "monthly" },
    { path: "consent/terms", priority: "0.5", changefreq: "monthly" },
    { path: "consent/cookies", priority: "0.5", changefreq: "monthly" },
  ];

  const urls = routes
    .map(
      ({ path, priority, changefreq }) => `
    <url>
      <loc>${baseUrl}/${path}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>${changefreq}</changefreq>
      <priority>${priority}</priority>
    </url>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls}
  </urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}

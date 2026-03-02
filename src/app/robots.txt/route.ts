import { NextResponse } from "next/server";

export async function GET() {
  const content = `
User-agent: *
Disallow: /profile
Disallow: /profile/billing
Disallow: /profile/payment_history
Disallow: /consent
Disallow: /_next
Disallow: /api

Sitemap: https://buffex.io/sitemap.xml
`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
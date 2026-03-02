import Footer from "@/components/footer";
import "./globals.css";
import Header from "@/components/header";
import { UserProvider } from "@/context/user-context";
import { SubscriptionProvider } from "@/context/subscription-context";
import { TokenPurchasesProvider } from "@/context/tokenpurchases-context";
import { StripeProvider } from "@/context/stripe-context";
import ConsentModal from "@/components/ConsentModal";
import AnalyticsGate from "@/components/AnalyticsGate";
import I18nProvider from "@/context/i18n-context";
import AppReadyProvider from "@/context/appready-context";
import InAppBrowserGuard from "@/components/InAppBrowserGuard";
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
export const dynamic = 'force-dynamic';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata = {
  title: "Buffex – Generador de recetas con IA",
  description:
    "Buffex te ayuda a crear recetas personalizadas según tus ingredientes, preferencias dietéticas y estilo de cocina.",
  keywords: [
    "Buffex",
    "recetas",
    "inteligencia artificial",
    "IA",
    "generador de recetas",
    "cocina",
    "nutrición",
    "dietas",
    "comida",
  ],
  authors: [{ name: "Buffex", url: "https://buffex.io" }],
  creator: "Buffex",
  publisher: "Buffex",
  metadataBase: new URL("https://buffex.io"),
  alternates: {
    canonical: "/",
    languages: {
      "es": "https://buffex.io",
      "en": "https://buffex.io",
    },
  },
  openGraph: {
    title: "Buffex – Generador de recetas con IA",
    description:
      "Buffex te ayuda a crear recetas personalizadas según tus ingredientes, preferencias dietéticas y estilo de cocina.",
    url: "https://buffex.io",
    siteName: "Buffex",
    images: [
      {
        url: "https://buffex.io/Buffex-Banner.png",
        width: 1200,
        height: 630,
        alt: "Buffex - Generador de recetas con IA",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Buffex – Generador de recetas con IA",
    description:
      "Buffex te ayuda a crear recetas personalizadas según tus ingredientes, preferencias dietéticas y estilo de cocina.",
    images: ["https://buffex.io/Buffex-Banner.png"],
    creator: "@BuffexOfficial",
  },
  icons: {
    icon: "/Buffex-Logo.png",
    apple: "/Buffex-Logo.png",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://buffex.io/#organization",
      "name": "Buffex",
      "url": "https://buffex.io",
      "logo": {
        "@type": "ImageObject",
        "url": "https://buffex.io/Buffex-Logo.png"
      },
      "sameAs": ["https://twitter.com/BuffexOfficial"]
    },
    {
      "@type": "WebApplication",
      "@id": "https://buffex.io/#webapp",
      "name": "Buffex – Generador de recetas con IA",
      "url": "https://buffex.io",
      "applicationCategory": "LifestyleApplication",
      "operatingSystem": "Web",
      "description": "Genera recetas personalizadas con IA según tus ingredientes, utensilios disponibles, restricciones dietéticas y estilo de cocina.",
      "offers": [
        {
          "@type": "Offer",
          "name": "Plan Gratuito",
          "price": "0",
          "priceCurrency": "EUR",
          "description": "5 recetas al mes"
        },
        {
          "@type": "Offer",
          "name": "Buffex Premium",
          "price": "9.99",
          "priceCurrency": "EUR",
          "description": "Recetas ilimitadas con todas las funciones avanzadas",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": "9.99",
            "priceCurrency": "EUR",
            "unitCode": "MON"
          }
        }
      ]
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${fraunces.variable} ${plusJakarta.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased flex flex-col h-screen">
        <UserProvider>
          <SubscriptionProvider>
            <TokenPurchasesProvider>
              <StripeProvider>
                <I18nProvider>
                  <AppReadyProvider>
                    <InAppBrowserGuard/>

                    <Header />

                    {/* Modal que solo aparece si es necesario */}
                    {<ConsentModal />}

                    {/* Contenedor que crece */}
                    <div className="flex-1 flex">{children}</div>

                    <Footer />
                  </AppReadyProvider>
                </I18nProvider>
              </StripeProvider>
            </TokenPurchasesProvider>
          </SubscriptionProvider>
        </UserProvider>
        {/* Analytics solo se monta si el usuario acepta analítica */}
        <AnalyticsGate />
      </body>
    </html>
  );
}

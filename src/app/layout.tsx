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
import { AuthModalProvider } from "@/context/auth-modal-context";
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
    },
    {
      "@type": "FAQPage",
      "@id": "https://buffex.io/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "¿Cómo funciona la generación de recetas con IA?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Nuestra plataforma utiliza inteligencia artificial de última generación, impulsada por la tecnología de OpenAI, para analizar tus ingredientes y generar recetas personalizadas adaptadas a tus gustos y necesidades."
          }
        },
        {
          "@type": "Question",
          "name": "¿Hay opciones para dietas especiales?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Absolutamente. Buffex soporta múltiples tipos de dietas, incluyendo vegetariana, vegana, keto, sin gluten y más."
          }
        },
        {
          "@type": "Question",
          "name": "¿Funciona en español?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Sí, Buffex funciona completamente en español. Puedes generar recetas en español o en inglés según el idioma de tu navegador."
          }
        },
        {
          "@type": "Question",
          "name": "¿Puedo cancelar la suscripción en cualquier momento?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Sí, puedes cancelar en cualquier momento desde tu perfil. Seguirás teniendo acceso a Premium hasta el final del período ya pagado, sin cargos adicionales."
          }
        },
        {
          "@type": "Question",
          "name": "¿Caducan los packs Pay-as-you-go?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No, las recetas que obtienes con los packs de pago único no caducan nunca. Se acumulan con las recetas de tu plan actual y puedes usarlas cuando quieras."
          }
        },
        {
          "@type": "Question",
          "name": "¿Qué pasa si se me acaban las recetas?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Podrás comprar paquetes adicionales desde tu cuenta en cualquier momento para seguir generando recetas. O también puedes esperar a que se renueven las recetas de tu plan actual, aunque sea el gratuito."
          }
        },
        {
          "@type": "Question",
          "name": "¿Tienen una versión gratuita?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Sí, ofrecemos un plan gratuito que incluye 5 recetas al mes para que puedas probar nuestro servicio."
          }
        },
        {
          "@type": "Question",
          "name": "¿Las recetas de la suscripción son permanentes?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No, las recetas que recibes con tu suscripción no son acumulables de un periodo a otro. Al finalizar el periodo de la suscripción, el saldo se restablece y recibes la cantidad correspondiente al nuevo periodo. Ten en cuenta que las recetas no utilizadas no se reembolsan."
          }
        },
        {
          "@type": "Question",
          "name": "¿Ofrecen reembolsos?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No ofrecemos reembolsos. Una vez compras recetas, se quedan en tu cuenta para su uso."
          }
        },
        {
          "@type": "Question",
          "name": "¿Ofrecen soporte técnico?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Sí, puedes contactarnos por email enviándonos un mensaje a contact@buffex.io."
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
                <AuthModalProvider>
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
                </AuthModalProvider>
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

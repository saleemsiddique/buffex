import { Metadata } from 'next';
import CookiesContent from '../../../components/CookieContent';

// Este es el componente principal de la página, un Server Component por defecto.
// Se usa para definir y exportar la metadata para SEO.
export const metadata: Metadata = {
  title: "Política de Cookies - Buffex",
  description: "Política de Cookies y gestión de consentimientos — Buffex.",
};

// El componente de la página solo renderiza el componente de cliente.
export default function CookiesPage() {
  return <CookiesContent />;
}

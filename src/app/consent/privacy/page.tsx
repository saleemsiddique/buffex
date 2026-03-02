import { Metadata } from 'next';
import PrivacyContent from '../../../components/PrivacyContent';

// Este es el componente de servidor que exporta la metadata de la página.
export const metadata: Metadata = {
  title: "Política de Privacidad - Buffex",
  description: "Política de Privacidad de Buffex — tratamiento de datos y derechos (GDPR).",
};

// El componente de página solo renderiza el componente de cliente.
export default function PrivacyPage() {
  return <PrivacyContent />;
}

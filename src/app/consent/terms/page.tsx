import { Metadata } from 'next';
import TermsContent from '../../../components/TermsConditions'

// Este es el componente de servidor que exporta la metadata de la página.
export const metadata: Metadata = {
  title: "Términos y Condiciones - Buffex",
  description: "Términos y Condiciones del servicio de Buffex.",
};

// El componente de página solo renderiza el componente de cliente.
export default function TermsPage() {
  return <TermsContent />;
}

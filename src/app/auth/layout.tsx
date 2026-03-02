import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accede a Buffex | Buffex",
  description: "Inicia sesión o crea tu cuenta gratuita en Buffex para empezar a generar recetas con IA.",
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

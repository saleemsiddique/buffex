import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi perfil | Buffex",
  description: "Gestiona tu cuenta, suscripción y métodos de pago en Buffex.",
  robots: { index: false, follow: false },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

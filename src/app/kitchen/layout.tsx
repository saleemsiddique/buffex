import { Metadata } from "next";
import KitchenLayoutClient from "./KitchenLayoutClient";

export const metadata: Metadata = {
  title: "Tu cocina | Buffex",
  description: "Genera y gestiona tus recetas personalizadas con IA.",
  robots: { index: false, follow: false },
};

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  return <KitchenLayoutClient>{children}</KitchenLayoutClient>;
}

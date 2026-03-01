"use client";

import React from "react";
import { Zap, TrendingUp, Crown, Star } from "lucide-react";
import { CustomUser } from "@/context/user-context";
import { useTranslation } from "react-i18next";

interface TokenPurchaseCardsProps {
  user: CustomUser | null;
  count: number;
  price: number;
  label: string;
  priceId: string;
  labelPromo?: string;
  promoType?: "limited" | "popular" | "value";
}

export default function TokenPurchaseCards({
  user,
  count,
  price,
  label,
  priceId,
  labelPromo,
  promoType,
}: TokenPurchaseCardsProps) {
  const userId = user?.uid ?? null;

  const handlePurchase = async () => {
    try {
      const res = await fetch("/api/embedded-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, userId }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "Error del servidor.");
        throw new Error(`Error en el servidor: ${res.status} ${text}`);
      }

      const data = await res.json();
      window.location.href = data.url;
    } catch (error) {
      console.error("Error al iniciar el pago:", error);
      alert("No se pudo iniciar el proceso de pago. Por favor, inténtelo de nuevo.");
    }
  };

  // Precio original para el descuento (33% más)
  const originalPrice = promoType === "limited" ? (price * 1.49).toFixed(2) : null;
  const savings = originalPrice ? (parseFloat(originalPrice) - price).toFixed(2) : null;

  const getPromoStyles = () => {
    switch (promoType) {
      case "limited":
        return {
          cardStyle: {
            border: "3px solid #dc2626",
            background: "linear-gradient(135deg, #fef2f2 0%, #fff5f5 50%, #fef2f2 100%)",
            boxShadow: "0 12px 30px rgba(220, 38, 38, 0.25), 0 0 0 4px rgba(220, 38, 38, 0.12), 0 4px 12px rgba(220, 38, 38, 0.15)",
            transform: "translateY(-2px)",
          },
          ribbonStyle: {
            background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
            color: "white",
            fontWeight: "800",
            letterSpacing: "0.5px",
            textShadow: "0 1px 2px rgba(0,0,0,0.3)",
          },
        };
      case "popular":
        return {
          cardStyle: {
            border: "2px solid var(--highlight)",
            background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
            boxShadow: "0 10px 25px rgba(230, 126, 34, 0.2), 0 0 0 3px rgba(230, 126, 34, 0.12)",
            transform: "translateY(-1px)",
          },
          ribbonStyle: {
            background: "linear-gradient(135deg, var(--highlight) 0%, var(--highlight-dark) 100%)",
            color: "white",
            fontWeight: "700",
          },
        };
      case "value":
        return {
          cardStyle: {
            border: "2px solid var(--primary)",
            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
            boxShadow: "0 8px 20px rgba(44, 62, 80, 0.15), 0 0 0 2px rgba(44, 62, 80, 0.1)",
            transform: "translateY(-1px)",
          },
          ribbonStyle: {
            background: "linear-gradient(135deg, var(--primary) 0%, #34495e 100%)",
            color: "white",
            fontWeight: "700",
          },
        };
      default:
        return {
          cardStyle: {
            border: "2px solid #e5e7eb",
            background: "linear-gradient(135deg, var(--background) 0%, #f9fafb 100%)",
            boxShadow: "0 6px 16px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.04)",
          },
          ribbonStyle: {},
        };
    }
  };

  const getPromoIcon = () => {
    switch (promoType) {
      case "limited":
        return <TrendingUp className="w-4 h-4" />;
      case "popular":
        return <Star className="w-4 h-4" />;
      case "value":
        return <Crown className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const promoStyles = getPromoStyles();
  const hasPromo = Boolean(labelPromo && promoType);
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={handlePurchase}
      className={`relative w-full text-left p-6 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer ${
        hasPromo ? "hover:scale-[1.03]" : "hover:shadow-lg"
      } z-10 hover:z-20`}
      style={{
        borderRadius: "var(--radius)",
        ...promoStyles.cardStyle,
      }}
      aria-label={`Comprar ${Math.round(count / 10)} recetas por ${price.toFixed(2)}€`}
    >
      {labelPromo && (
        <div
          className="absolute top-8 -right-10 transform rotate-45 px-8 py-2 text-center text-xs font-bold uppercase shadow-lg flex items-center gap-1"
          style={{
            ...promoStyles.ribbonStyle,
            zIndex: 10,
            minWidth: "120px",
          }}
        >
          {getPromoIcon()}
          {labelPromo}
        </div>
      )}
      
      <div className="flex flex-col h-full justify-between">
        <div className="flex items-center mb-4">
          <div 
            className={`p-2 rounded-full ${hasPromo ? 'shadow-md' : 'shadow-sm'}`}
            style={{ 
              backgroundColor: hasPromo 
                ? (promoType === "limited" ? "rgba(220, 38, 38, 0.1)" : "rgba(230, 126, 34, 0.1)")
                : "rgba(59, 130, 246, 0.1)"
            }}
          >
            <Zap 
              className="w-6 h-6" 
              style={{ color: hasPromo ? (promoType === "limited" ? "#dc2626" : "var(--highlight)") : "var(--primary)" }} 
            />
          </div>
          <h3 
            className="text-2xl font-bold ml-3"
            style={{ color: "var(--foreground)" }}
          >
            {Math.round(count / 10)} Recetas
          </h3>
        </div>
        
        <p 
          className="mb-4 text-sm font-medium"
          style={{ color: "var(--foreground)", opacity: 0.85 }}
        >
          {label}
        </p>
        
        <div className="mt-auto">
          {promoType === "limited" && originalPrice && savings && (
            <div className="mb-2">
              <span 
                className="text-lg font-semibold line-through opacity-60"
                style={{ color: "var(--foreground)" }}
              >
                €{originalPrice}
              </span>
              <span 
                className="ml-2 text-sm font-bold px-2 py-1 rounded"
                style={{ 
                  backgroundColor: "#dc2626", 
                  color: "white" 
                }}
              >
                {t("tokens.modal.promoTypes.save")} €{savings}!
              </span>
            </div>
          )}
          
          <div className="flex items-baseline gap-2">
            <span 
              className="text-4xl font-extrabold"
              style={{ 
                color: hasPromo 
                  ? (promoType === "limited" ? "#dc2626" : "var(--highlight)")
                  : "var(--primary)" 
              }}
            >
              €{price.toFixed(2)}
            </span>
            {promoType === "limited" && (
              <span 
                className="text-lg font-bold"
                style={{ color: "#dc2626" }}
              >
                33% OFF
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-1">
            <p 
              className="text-sm font-medium"
              style={{ color: "var(--foreground)", opacity: 0.7 }}
            >
              €{(price / count).toFixed(2)} {t("tokens.modal.promoTypes.perToken")}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}

// components/ProfileContent.tsx
"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CustomUser, useUser } from "@/context/user-context";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CreditCard,
  Calendar,
  AlertTriangle,
  Edit,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  User,
  Mail,
  Crown,
  Coins,
  Settings,
  LogOut,
  History,
  BookOpen,
  Zap,
  ChevronRight, // ⬅️ flecha para el final
} from "lucide-react";
import { useSubscription } from "@/context/subscription-context";
import Onboarding from "@/components/onboarding";
import { TokensModal } from "@/components/SideMenu/TokensModal";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const { user, logout, updateUserName, setNewsletterConsent } = useUser();
  const { subscription } = useSubscription();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCancelNowDialog, setShowCancelNowDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [newsletterChecked, setNewsletterChecked] = useState<boolean>(!!user?.newsletterConsent);
  const [newsletterSaving, setNewsletterSaving] = useState(false);
  const { t } = useTranslation();

  // Estados para editar nombre
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.firstName || "");
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    setNewsletterChecked(!!user?.newsletterConsent);
  }, [user?.newsletterConsent]);

  const handleToggleNewsletter = async (checked: boolean) => {
    if (!setNewsletterConsent) return;
    setNewsletterSaving(true);
    try {
      await setNewsletterConsent(checked);

      setMessageModal({
        visible: true,
        title: t("profile.modals.message.success"),
        text: checked
          ? t("profile.newsletter.subscribed")
          : t("profile.newsletter.unsubscribed"),
        isError: false,
      });

      setNewsletterChecked(checked);
    } catch (e) {
      console.error("Newsletter toggle error:", e);
      setMessageModal({
        visible: true,
        title: t("profile.modals.message.error"),
        text: t("profile.newsletter.error"),
        isError: true,
      });
      setNewsletterChecked((prev) => !prev);
    } finally {
      setNewsletterSaving(false);
    }
  };

  // Modal de mensaje
  const [messageModal, setMessageModal] = useState({
    visible: false,
    title: "",
    text: "",
    isError: false,
  });

  const totalOfTokens = (user?.monthly_recipes ?? 0) + (user?.extra_recipes ?? 0);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error(t("profile.errors.logout"), error);
    }
  };

  const handlePaymentHistory = () => {
    router.push("/profile/payment_history");
  };

  const handleCustomerPortal = () => {
    router.push("/profile/billing");
  };

  // Guardar nombre
  const handleSaveName = async () => {
    if (!newName.trim()) {
      setMessageModal({
        visible: true,
        title: t("profile.modals.message.error"),
        text: t("profile.personalInfo.nameRequired"),
        isError: true,
      });
      return;
    }

    setIsSavingName(true);
    try {
      if (updateUserName) {
        await updateUserName(newName.trim());
      } else {
        const response = await fetch("/api/user/update-name", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user?.uid, firstName: newName.trim() }),
        });
        if (!response.ok) throw new Error("Error al actualizar el nombre");
      }

      setIsEditingName(false);
      setMessageModal({
        visible: true,
        title: t("profile.modals.message.success"),
        text: t("profile.personalInfo.nameUpdated"),
        isError: false,
      });

      if (!updateUserName) window.location.reload();
    } catch (error) {
      console.error("Error:", error);
      setMessageModal({
        visible: true,
        title: t("profile.modals.message.error"),
        text: t("profile.personalInfo.nameError"),
        isError: true,
      });
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCancelEdit = () => {
    setNewName(user?.firstName || "");
    setIsEditingName(false);
  };

  // Suscripción
  const handleCancelSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.uid }),
      });
      if (!response.ok) throw new Error("Error al cancelar la suscripción");

      // Calcular próxima renovación a partir de lastRenewal + 30 días
      const subscriptionEndDate = user?.lastRenewal
        ? new Date(user.lastRenewal.toDate().getTime() + 30 * 24 * 60 * 60 * 1000)
        : null;
      const formattedEndDate = subscriptionEndDate
        ?.toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });

      const emailResponse = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "unsubscribe",
          to: user?.email,
          data: { name: user?.firstName || user?.email, endDate: formattedEndDate },
          lang: i18n.language,
        }),
      });

      if (!emailResponse.ok) console.error("Error al enviar el correo de confirmación");

      setMessageModal({
        visible: true,
        title: t("profile.modals.message.success"),
        text: t("profile.modals.message.subscriptionCancelled"),
        isError: false,
      });

      window.location.reload();
    } catch (error) {
      console.error("Error:", error);
      setMessageModal({
        visible: true,
        title: t("profile.modals.message.error"),
        text: t("profile.modals.message.subscriptionError"),
        isError: true,
      });
    } finally {
      setIsLoading(false);
      setShowCancelDialog(false);
      setShowReactivateDialog(false);
    }
  };

  const handleCancelImmediateSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/subscription/cancel-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.uid }),
      });
      if (!response.ok) throw new Error("Error al cancelar la suscripción");

      setMessageModal({
        visible: true,
        title: t("profile.modals.message.success"),
        text: t("profile.modals.message.subscriptionCancelledNow"),
        isError: false,
      });

      window.location.reload();
    } catch (error) {
      console.error("Error:", error);
      setMessageModal({
        visible: true,
        title: t("profile.modals.message.error"),
        text: t("profile.modals.message.subscriptionError"),
        isError: true,
      });
    } finally {
      setIsLoading(false);
      setShowCancelDialog(false);
      setShowReactivateDialog(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/subscription/reactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.uid }),
      });
      if (!response.ok) throw new Error("Error al reactivar la suscripción");

      setMessageModal({
        visible: true,
        title: t("profile.modals.message.success"),
        text: t("profile.modals.message.subscriptionReactivated"),
        isError: false,
      });

      window.location.reload();
    } catch (error) {
      console.error("Error:", error);
      setMessageModal({
        visible: true,
        title: t("profile.modals.message.error"),
        text: t("profile.modals.message.subscriptionReactivateError"),
        isError: true,
      });
    } finally {
      setIsLoading(false);
      setShowCancelDialog(false);
      setShowReactivateDialog(false);
    }
  };

  const formatDate = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });
  };

  const getSubscriptionStatus = () => {
    if (!user?.isSubscribed)
      return { text: t("profile.subscription.premium.status.noSubscription"), color: "text-[#6B7280]" };
    if (user?.subscriptionCanceled)
      return { text: t("profile.subscription.premium.status.cancelled"), color: "text-[var(--highlight)]" };
    if (user?.subscriptionStatus === "payment_failed") {
      return { text: t("profile.subscription.premium.status.paymentFailed"), color: "text-[var(--highlight)]" };
    }
    return { text: t("profile.subscription.premium.status.active"), color: "text-emerald-600" };
  };

  const subscriptionStatus = getSubscriptionStatus();

  return (
    <div className="min-h-screen w-full py-18 px-4" style={{ background: "#FAFAF9" }}>
      {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <div className="w-26 h-26 bg-gradient-to-br from-[var(--highlight)] to-[var(--highlight-dark)] rounded-full flex items-center justify-center shadow-2xl mb-6 border-4 border-white">
              <User className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-[#111111] mb-2">
            {t("profile.greeting", { name: user?.firstName })}<br />
          </h1>
          <p className="text-[#6B7280] text-lg">{t("profile.subtitle")}</p>
        </div>

        {/* Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Personal Info */}
            <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E5E5E3", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-r from-[var(--highlight)] to-[var(--highlight-dark)] rounded-lg p-2 mr-3">
                  <User className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">
                  {t("profile.personalInfo.title")}
                </h2>
              </div>

              {/* Name */}
              <div className="mb-6">
                <label className="text-sm font-medium text-[var(--foreground)] opacity-70 block mb-2">
                  {t("profile.personalInfo.name")}
                </label>
                {!isEditingName ? (
                  <div className="flex items-center justify-between rounded-xl p-3" style={{ background: "#F5F5F4", border: "1px solid #E5E5E3" }}>
                    <span className="text-[var(--foreground)] font-medium">
                      {user?.firstName}
                    </span>
                    <Button
                      onClick={() => setIsEditingName(true)}
                      variant="ghost"
                      size="sm"
                      className="p-2 h-8 w-8 text-[var(--highlight)] hover:bg-orange-100 rounded-lg"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316] transition-colors duration-200 bg-white"
                      style={{ border: "1px solid #E5E5E3" }}
                      placeholder={t("profile.personalInfo.namePlaceholder")}
                      disabled={isSavingName}
                    />
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleSaveName}
                        size="sm"
                        className="flex-1 bg-[var(--highlight)] text-white hover:bg-[var(--highlight-dark)] rounded-xl"
                        disabled={isSavingName}
                      >
                        {isSavingName ? (
                          t("profile.personalInfo.saving")
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-1" /> {t("profile.personalInfo.save")}
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        variant="outline"
                        size="sm"
                        className="px-4 border-gray-300 text-gray-600 hover:bg-gray-100 rounded-xl"
                        disabled={isSavingName}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-medium text-[var(--foreground)] opacity-70 block mb-2">
                  {t("profile.personalInfo.email")}
                </label>
                <div className="flex items-center bg-gray-50/80 rounded-xl p-3 border border-gray-100 min-w-0">
                  <Mail className="h-4 w-4 text-[var(--highlight)] mr-2" />
                  <span className="text-[var(--foreground)] truncate">{user?.email}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E5E5E3", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-[var(--highlight)]" />
                {t("profile.quickActions.title")}
              </h3>
              {/* How it works */}
              <Button
                onClick={() => setShowOnboarding(true)}
                className="w-full justify-start bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 rounded-xl py-3 shadow-lg"
              >
                <BookOpen className="h-4 w-4 mr-3" />
                {t("profile.quickActions.howItWorks")}
              </Button>

              {/* Newsletter quick action */}
              <div className="mt-5 p-4 rounded-xl bg-[#f97316]/5" style={{ border: "1px solid rgba(249,115,22,0.2)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-[var(--highlight)]" />
                    <div>
                      <p className="font-medium text-[var(--foreground)]">
                        {t("profile.newsletter.title")}
                      </p>
                      <p className="text-sm text-[var(--foreground)]/70">
                        {t("profile.newsletter.helper")}
                      </p>
                    </div>
                  </div>

                  <label className="inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={newsletterChecked}
                      onChange={(e) => handleToggleNewsletter(e.target.checked)}
                      disabled={newsletterSaving}
                      aria-label={t("profile.newsletter.aria") || "Suscripción al newsletter"}
                    />
                    <div
                      className={`
                        w-11 h-6 rounded-full transition
                        ${newsletterChecked ? "bg-[var(--highlight)]" : "bg-gray-300"}
                        relative
                      `}
                    >
                      <span
                        className={`
                          absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition
                          ${newsletterChecked ? "translate-x-5" : ""}
                        `}
                      />
                    </div>
                  </label>
                </div>
              </div>

              {/* Language Switcher */}
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => i18n.changeLanguage("en")}
                  className={`flex-1 py-3 rounded-xl font-semibold shadow-lg transition-all relative ${i18n.language === "en"
                      ? "bg-gradient-to-r from-[var(--highlight)] to-[var(--highlight-dark)] text-white ring-2 ring-[var(--highlight)]/50 ring-offset-2"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                >
                  English
                </button>
                <button
                  onClick={() => i18n.changeLanguage("es")}
                  className={`flex-1 py-3 rounded-xl font-semibold shadow-lg transition-all relative ${i18n.language === "es"
                      ? "bg-gradient-to-r from-[var(--highlight)] to-[var(--highlight-dark)] text-white ring-2 ring-[var(--highlight)]/50 ring-offset-2"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                >
                  Español
                </button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Premium Subscription Card */}
            {user?.isSubscribed && (
              <div className="bg-gradient-to-br from-[var(--primary)] via-[var(--primary)] to-slate-800 text-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="bg-[var(--highlight)] rounded-full p-3 mr-4">
                        <Crown className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{t("profile.subscription.premium.title")}</h2>
                        <p className="text-white/80">{t("profile.subscription.premium.description")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${subscriptionStatus.text === t("profile.subscription.premium.status.active")
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-[var(--highlight)]/20 text-orange-300"
                          }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mr-2 ${subscriptionStatus.text === t("profile.subscription.premium.status.active")
                              ? "bg-emerald-300"
                              : "bg-orange-300"
                            }`}
                        />
                        {subscriptionStatus.text}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
                      <div className="flex items-center mb-2">
                        <Calendar className="h-5 w-5 text-[var(--highlight)] mr-2" />
                        <span className="text-sm text-white/80">{t("profile.subscription.premium.nextBilling")}</span>
                      </div>
                      <p className="text-xl font-semibold">
                        {subscription?.endsAt ? formatDate(subscription.endsAt.toDate()) : "N/A"}
                      </p>
                    </div>

                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
                      <div className="flex items-center mb-2">
                        <Coins className="h-5 w-5 text-[var(--highlight)] mr-2" />
                        <span className="text-sm text-white/80">{t("profile.subscription.premium.availableTokens")}</span>
                      </div>
                      <p className="text-xl font-semibold text-[var(--highlight)]">
                        {totalOfTokens.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Subscription Actions */}
                  {user?.isSubscribed &&
                    !user?.subscriptionCanceled &&
                    user?.subscriptionStatus !== "payment_failed" && (
                      <div className="flex justify-center">
                        <Button
                          onClick={() => setShowCancelDialog(true)}
                          variant="outline"
                          className="border-red-900 text-red-900 hover:bg-red-100 hover:border-red-400 rounded-xl backdrop-blur-sm"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          {t("profile.subscription.premium.cancel")}
                        </Button>
                      </div>
                    )}

                  {/* Payment Failed Action */}
                  {user?.subscriptionStatus === "payment_failed" && (
                    <div className="text-center">
                      <Button
                        onClick={() => setShowCancelNowDialog(true)}
                        className="bg-red-600 text-white hover:bg-red-700 rounded-xl"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        {t("profile.subscription.premium.cancelNow")}
                      </Button>
                    </div>
                  )}

                  {/* Cancelled Notice */}
                  {user?.isSubscribed && user?.subscriptionCanceled && (
                    <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-6 backdrop-blur-sm">
                      <div className="flex items-center justify-center mb-4">
                        <AlertTriangle className="h-6 w-6 text-red-300 mr-3" />
                        <p className="text-red-200 font-medium text-center">
                          {t("profile.subscription.premium.cancelledNotice", {
                            date: subscription?.endsAt ? formatDate(subscription.endsAt.toDate()) : "final del período",
                          })}
                        </p>
                      </div>
                      <div className="text-center">
                        <Button
                          onClick={() => setShowReactivateDialog(true)}
                          className="bg-[var(--highlight)] text-white hover:bg-[var(--highlight-dark)] rounded-xl"
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          {t("profile.subscription.premium.reactivate")}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Free Account Upgrade */}
            {!user?.isSubscribed && (
              <div className="bg-white rounded-2xl p-8 text-center" style={{ border: "2px dashed rgba(249,115,22,0.3)" }}>
                <div className="bg-gradient-to-r from-[var(--highlight)] to-[var(--highlight-dark)] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <Crown className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--foreground)] mb-3">
                  {t("profile.subscription.free.title")}
                </h2>
                <p className="text-[var(--foreground)]/70 mb-6 text-lg">
                  {t("profile.subscription.free.description")}
                </p>
                <div className="max-w-md mx-auto" onClick={() => setShowPremium(true)}>
                  <div className="w-full flex flex-col items-center gap-4">
                    <button className="w-full cursor-pointer px-5 flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-orange-700 transition-all duration-300 ease-in-out">
                      {t("profile.subscription.free.subscribe")}
                    </button>
                  </div>
                </div>
              </div>
            )}


            {/* Billing (card completa clicable) */}
            <div
              role="button"
              tabIndex={0}
              onClick={handleCustomerPortal}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleCustomerPortal()}
              className="group bg-white rounded-2xl p-6 mb-3 cursor-pointer transition-all duration-200 hover:shadow-md"
              style={{ border: "1px solid #E5E5E3", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
              aria-label={t("profile.quickActions.billing")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/90 rounded-lg p-2">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-[var(--foreground)]">
                    {t("profile.quickActions.billing")}
                  </h4>
                </div>
                <ChevronRight className="h-5 w-5 text-[var(--foreground)]/50 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>

            {/* Payment History (card completa clicable) */}
            <div
              role="button"
              tabIndex={0}
              onClick={handlePaymentHistory}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handlePaymentHistory()}
              className="group bg-white rounded-2xl p-6 mb-3 cursor-pointer transition-all duration-200 hover:shadow-md"
              style={{ border: "1px solid #E5E5E3", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
              aria-label={t("profile.quickActions.paymentHistory")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-[var(--highlight)] to-[var(--highlight-dark)] rounded-lg p-2">
                    <History className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-[var(--foreground)]">
                    {t("profile.quickActions.paymentHistory")}
                  </h4>
                </div>
                <ChevronRight className="h-5 w-5 text-[var(--foreground)]/50 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>


            {/* Logout Section */}
            <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E5E5E3", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-1">
                    {t("profile.logout.title")}
                  </h3>
                  <p className="text-[var(--foreground)]/60 text-sm">
                    {t("profile.logout.description")}
                  </p>
                </div>
                <Button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 rounded-xl px-6 py-3 shadow-lg"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("profile.logout.button")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full" style={{ border: "1px solid #E5E5E3", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
            <div className="text-center text-[var(--foreground)]">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">{t("profile.modals.cancelSubscription.title")}</h3>
              <p className="text-[var(--foreground)]/70 mb-8 leading-relaxed">
                {t("profile.modals.cancelSubscription.message")}
              </p>
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowCancelDialog(false)}
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-100 rounded-xl py-3"
                  disabled={isLoading}
                >
                  {t("profile.modals.cancelSubscription.keep")}
                </Button>
                <Button
                  onClick={handleCancelSubscription}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-3"
                  disabled={isLoading}
                >
                  {isLoading ? t("profile.modals.cancelSubscription.cancelling") : t("profile.modals.cancelSubscription.confirm")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCancelNowDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full" style={{ border: "1px solid #E5E5E3", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
            <div className="text-center text-[var(--foreground)]">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">{t("profile.modals.cancelNow.title")}</h3>
              <p className="text-[var(--foreground)]/70 mb-8 leading-relaxed">
                {t("profile.modals.cancelNow.message")}
              </p>
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowCancelNowDialog(false)}
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-100 rounded-xl py-3"
                  disabled={isLoading}
                >
                  {t("profile.modals.cancelNow.keep")}
                </Button>
                <Button
                  onClick={handleCancelImmediateSubscription}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-3"
                  disabled={isLoading}
                >
                  {isLoading ? t("profile.modals.cancelNow.cancelling") : t("profile.modals.cancelNow.confirm")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReactivateDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full" style={{ border: "1px solid #E5E5E3", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
            <div className="text-center text-[var(--foreground)]">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">{t("profile.modals.reactivate.title")}</h3>
              <p className="text-[var(--foreground)]/70 mb-8 leading-relaxed">
                {t("profile.modals.reactivate.message")}
              </p>
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowReactivateDialog(false)}
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-100 rounded-xl py-3"
                  disabled={isLoading}
                >
                  {t("profile.modals.reactivate.cancel")}
                </Button>
                <Button
                  onClick={handleReactivateSubscription}
                  className="flex-1 bg-[var(--highlight)] hover:bg-[var(--highlight-dark)] text-white rounded-xl py-3"
                  disabled={isLoading}
                >
                  {isLoading ? t("profile.modals.reactivate.reactivating") : t("profile.modals.reactivate.confirm")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {messageModal.visible && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full" style={{ border: "1px solid #E5E5E3", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
            <div className="text-center text-[var(--foreground)]">
              <div
                className={`rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 ${messageModal.isError ? "bg-red-100" : "bg-green-100"
                  }`}
              >
                {messageModal.isError ? (
                  <AlertCircle className="h-8 w-8 text-red-500" />
                ) : (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                )}
              </div>
              <h3 className="text-xl font-bold mb-3">{messageModal.title}</h3>
              <p className="text-[var(--foreground)]/70 mb-8 leading-relaxed">{messageModal.text}</p>
              <Button
                onClick={() => setMessageModal({ ...messageModal, visible: false })}
                className="bg-[var(--highlight)] hover:bg-[var(--highlight-dark)] text-white rounded-xl px-8 py-3"
              >
                {t("profile.modals.message.close")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showPremium && (
        <TokensModal
          user={user as CustomUser | null}
          onClose={() => setShowPremium(false)}
        />
      )}
    </div>
  );
}

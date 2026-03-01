"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, BookOpen, Menu, X, User, Crown, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, CustomUser } from '@/context/user-context';
import { TokensModal } from "./SideMenu/TokensModal";
import { useTranslation } from "react-i18next";

interface SideMenuProps {
  className?: string;
}

interface LucideIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
  absoluteStrokeWidth?: boolean;
}

const SideMenuItem: React.FC<{ href: string; icon: React.ReactNode; label: string }> = ({ href, icon, label }) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href === '/kitchen/recipes/list' && pathname.startsWith('/kitchen/recipes/list'));

  return (
    <Link href={href} passHref>
      <motion.div
        className={`
          w-full h-20 flex flex-col items-center justify-center rounded-xl transition-all duration-200 p-2 cursor-pointer
          ${isActive
            ? 'bg-gradient-to-r from-[#f97316] to-[#ea580c] text-white shadow-lg'
            : 'text-white/60 hover:text-white hover:bg-white/10'
          }
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={label}
      >
        {React.cloneElement(icon as React.ReactElement<LucideIconProps>, { className: `w-8 h-8 ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white'}` })}
        <span className="text-xs mt-1 font-semibold">{label}</span>
      </motion.div>
    </Link>
  );
};

const MobileMenuItem: React.FC<{ href: string; icon: React.ReactNode; label: string; onClick: () => void }> = ({ href, icon, label, onClick }) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href === '/kitchen/recipes/list' && pathname.startsWith('/kitchen/recipes/list'));

  return (
    <Link href={href} passHref>
      <motion.div
        onClick={onClick}
        className={`flex items-center gap-4 py-3 px-4 rounded-xl transition-colors duration-200 cursor-pointer w-full justify-center
          ${isActive
            ? 'bg-gradient-to-r from-[#f97316] to-[#ea580c] text-white shadow-md'
            : 'text-white/70 hover:bg-white/10 hover:text-white'
          }
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {React.cloneElement(icon as React.ReactElement<LucideIconProps>, { className: `w-8 h-8 ${isActive ? 'text-white' : 'text-white/60'}` })}
        <span className="text-xl font-semibold">{label}</span>
      </motion.div>
    </Link>
  );
};

const SideMenu: React.FC<SideMenuProps> = ({ className = '' }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showTokens, setShowTokens] = useState(false);
  const { user } = useUser(); // CustomUser | null
  const { t } = useTranslation();

  const totalTokens = (user?.monthly_recipes || 0) + (user?.extra_recipes || 0);
  const remainingTokens = totalTokens;
  const onOpenTokens = () => setShowTokens(true);

  return (
    <>
      {/* Botón flotante en móvil (solo si drawer está cerrado) */}
      <AnimatePresence>
        {!drawerOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-4 left-4 z-50 bg-[var(--highlight)] text-[var(--text2)] rounded-full p-3 shadow-lg md:hidden transition"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Drawer animado a pantalla completa en móvil */}
      <div
        className={`fixed inset-0 z-40 transform transition-transform duration-300 ease-in-out md:hidden ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      style={{ background: "#111111" }}
      >
        {/* Botón cerrar */}
        <div className="flex justify-end p-4">
          <button
            className="text-white/40 hover:text-white transition"
            onClick={() => setDrawerOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="w-8 h-8" />
          </button>
        </div>

        {/* Contenido centrado */}
        <div className="flex flex-col items-center justify-center gap-3 p-4 flex-grow">
          <MobileMenuItem href="/kitchen" icon={<Plus />} label={t("header.menu.newRecipe")} onClick={() => setDrawerOpen(false)} />
          <MobileMenuItem href="/kitchen/recipes/list" icon={<BookOpen />} label={t("header.menu.myRecipes")} onClick={() => setDrawerOpen(false)} />
          <MobileMenuItem href="/profile" icon={<User />} label={t("header.menu.myProfile")} onClick={() => setDrawerOpen(false)} />

          {/* Sección de Tokens en Móvil */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mt-8 p-6 rounded-xl shadow-xl text-white text-center w-full max-w-sm"
              style={{ background: "#1a1a1a", border: "1px solid rgba(249,115,22,0.25)" }}
            >
              <h3 className="text-xl font-bold mb-3">{t("header.tokens.title")}</h3>
              <div className="space-y-2 mb-4">
                <p className="flex justify-between items-center text-lg">
                  <span>{t("header.tokens.monthly")}</span> <span className="font-bold text-[var(--highlight)]">{user?.monthly_recipes || 0}</span>
                </p>
                <p className="flex justify-between items-center text-lg">
                  <span>{t("header.tokens.extra")}</span> <span className="font-bold text-[var(--highlight)]">{user?.extra_recipes || 0}</span>
                </p>
              </div>
              <p className="text-sm italic mb-4">
                {t("header.tokens.total")} <span className="font-bold text-[var(--highlight)] text-xl">{totalTokens}</span>
              </p>

              {/* Botón para abrir el modal de tokens */}
              <motion.button
                onClick={() => {
                  onOpenTokens();
                  setDrawerOpen(false); // Cierra el cajón al abrir el modal
                }}
                className="w-full py-3 rounded-full text-lg font-bold shadow-lg transition-all duration-300
                          bg-gradient-to-r from-[var(--highlight)] to-[var(--highlight-dark)] text-[var(--text2)]
                          hover:from-[var(--highlight-dark)] hover:to-[var(--highlight)] focus:outline-none focus:ring-4 focus:ring-[var(--highlight)] text-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                role="button"
              >
                {t("header.tokens.buy")}
              </motion.button>

              {/* Botón para el modal de Premium */}
              <motion.button
                onClick={() => {
                  onOpenTokens();
                  setDrawerOpen(false); // Cierra el cajón al abrir el modal
                }}
                className="w-full py-3 mt-4 rounded-full text-lg font-bold shadow-lg transition-all duration-300
                          bg-gradient-to-r from-yellow-400 to-yellow-600 text-white
                          hover:from-[var(--foreground)] hover:to-[var(--primary)] focus:outline-none focus:ring-4 focus:ring-[var(--foreground)] text-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                role="button"
              >
                {user?.isSubscribed ? t("header.tokens.premium.current") : t("header.tokens.premium.subscribeButton")}
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Side menu para escritorio */}
      <aside
        className={`
          hidden md:flex
          fixed top-16 bottom-0 left-0 w-24 h-[calc(100vh-4rem)]
          flex-col items-center justify-start
          py-6 shadow-lg
          ${className}
        `}
        style={{ background: "#111111", borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex flex-col gap-6 w-full px-2 mt-4">
          <SideMenuItem href="/kitchen" icon={<Plus />} label={t("sideMenu.new")}  />
          <SideMenuItem href="/kitchen/recipes/list" icon={<BookOpen />} label={t("sideMenu.recipes")} />
        </div>

        {/* Espacio flexible para empujar controles abajo */}
        <div className="flex-1" />

        {/* Sección inferior: tokens / premium */}
        <div className="w-full px-3 space-y-4">
          {user ? (
            <div className="flex flex-col items-center gap-3">

              {/* Botón de Tokens */}
              <motion.button
                onClick={onOpenTokens}
                className="relative w-16 h-16 rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:scale-105 group"
                title={t("sideMenu.tokens.button")}
                aria-label={t("sideMenu.tokens.button")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Fondo animado */}
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--highlight)] to-[var(--highlight-dark)]" />
                
                {/* Contenido del botón */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text2)] transition-opacity duration-300 group-hover:opacity-0 z-10">
                  <Zap className="w-6 h-6" />
                  <span className="mt-1 text-xs font-semibold">{remainingTokens}</span>
                </div>
                
                {/* Tooltip en hover */}
                <span className="absolute inset-0 flex items-center justify-center text-[var(--text2)] text-xs font-semibold opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10">
                  {t("sideMenu.tokens.buy")}
                </span>
                
                {/* Indicador de tokens bajos */}
                {remainingTokens <= 5 && (
                  <div className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse z-20" />
                )}
              </motion.button>
              
              {/* Botón de Premium */}
              <motion.button
                onClick={onOpenTokens}
                className={`relative w-16 h-16 rounded-xl border-2 transition-all duration-300 hover:scale-105 group ${
                  user?.isSubscribed
                    ? "border-[#ea580c] bg-gradient-to-br from-[#f97316]/30 to-[#ea580c]/30"
                    : "border-dashed border-[#f97316]/60"
                }`}
                title={t("sideMenu.premium.button")}
                aria-label={t("sideMenu.premium.button")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative flex flex-col items-center justify-center text-[#f97316]">
                  <Crown className="w-6 h-6" />
                  <span className="mt-1 text-xs font-semibold">
                    {user?.isSubscribed ? t("sideMenu.premium.active") : t("sideMenu.premium.inactive")}
                  </span>
                </div>
              </motion.button>

            </div>
          ) : (
            <Link
              href="/login"
              className="block w-full text-center py-2 rounded-lg text-sm font-medium bg-[var(--highlight)] text-[var(--text2)] hover:opacity-95 transition"
            >
              {t("sideMenu.auth.login")}
            </Link>
          )}
        </div>
      </aside>

      {/* Modales */}
      {showTokens && <TokensModal user={user as CustomUser | null} onClose={() => setShowTokens(false)} />}
    </>
  );
};

export default SideMenu;
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, CustomUser } from '@/context/user-context';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen, Menu, X, User, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { TokensModal } from "./SideMenu/TokensModal";
import { useTranslation } from "react-i18next";
import { useAuthModal } from "@/context/auth-modal-context";

// Definición de las props para los iconos de Lucide-React
interface LucideIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
  absoluteStrokeWidth?: boolean;
}

// Componente para los elementos del menú móvil
const MobileMenuItem: React.FC<{ href: string; icon: React.ReactNode; label: string; onClick: () => void }> = ({ href, icon, label, onClick }) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href === '/kitchen/recipes/list' && pathname.startsWith('/kitchen/recipes/list'));

  return (
    <Link href={href} passHref>
      <motion.div
        onClick={onClick}
        className={`flex items-center gap-4 py-3 px-4 rounded-lg transition-colors duration-200 cursor-pointer w-full justify-start
          ${isActive
            ? 'bg-gradient-to-r from-[var(--highlight)] to-[var(--highlight-dark)] text-[var(--text2)] shadow-md'
            : 'bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--primary)]/10'
          }
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {React.cloneElement(icon as React.ReactElement<LucideIconProps>, { className: `w-8 h-8 ${isActive ? 'text-[var(--text2)]' : 'text-[var(--foreground)]'}` })}
        <span className="text-xl font-semibold">{label}</span>
      </motion.div>
    </Link>
  );
};

export default function Header() {
  const pathname = usePathname();
  const { user } = useUser() || {};
  const isLoggedIn = !!user;
  const { t } = useTranslation();

  // Estados para el menú móvil y la responsividad
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Estados para los modales a pantalla completa
  const [showTokens, setShowTokens] = useState(false);
  const { openAuthModal } = useAuthModal();
  // Estado para el popup de tokens en escritorio
  const [showTokensPopup, setShowTokensPopup] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Hook para detectar el tamaño de la ventana y actualizar el estado dinámicamente
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lógica para determinar si estamos en una página de perfil en móvil
  const isMobileProfilePage = isMobile && pathname.startsWith('/profile');
  const isAuthPage = isMobile && pathname.startsWith('/auth');

  // Lógica para determinar si mostrar la cabecera en general
  const shouldHideHeader = isMobile && !isMobileProfilePage && !isAuthPage && pathname !== '/';

  // Calcular el total de recetas disponibles
  const totalRecipes = (user?.monthly_recipes || 0) + (user?.extra_recipes || 0);
  const isLowRecipes = totalRecipes <= 2;

  // Clases mejoradas para el botón especial (Empezar)
  const specialButtonClasses =
    "px-6 py-2 rounded-full text-lg font-semibold shadow-lg transition-all duration-300 cursor-pointer " +
    "bg-gradient-to-r from-[var(--highlight)] to-[var(--highlight-dark)] text-[var(--text2)] " +
    "hover:from-[var(--highlight-dark)] hover:to-[var(--highlight)] focus:outline-none focus:ring-4 focus:ring-[var(--highlight)]";

  return (
    <>
      {/* Modales a pantalla completa */}
      {showTokens && <TokensModal user={user as CustomUser | null} onClose={() => setShowTokens(false)} />}

      <header
        className={`w-full fixed top-0 left-0 z-50 transition-all duration-300
          ${shouldHideHeader ? 'hidden' : ''}
        `}
        style={{ background: "#0f0f0f", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Botón flotante y drawer animado para páginas de perfil en móvil */}
        {isMobileProfilePage && (
          <>
            <AnimatePresence>
              {!drawerOpen && (
                <motion.button
                  key="menu-button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="fixed top-4 left-4 z-50 bg-[var(--highlight)] text-[var(--text2)] rounded-full p-3 shadow-lg transition"
                  onClick={() => setDrawerOpen(true)}
                  aria-label={t("header.menu.open")}
                >
                  <Menu className="w-6 h-6" />
                </motion.button>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {drawerOpen && (
                <motion.div
                  key="mobile-drawer"
                  initial={{ x: '-100%' }}
                  animate={{ x: '0%' }}
                  exit={{ x: '-100%' }}
                  transition={{ type: "tween", duration: 0.3 }}
                  className="fixed top-0 left-0 w-screen h-screen z-40 md:hidden flex flex-col"
                  style={{ background: "#111111" }}
                >
                  {/* Contenido del drawer */}
                  <div className="flex justify-between items-center p-4">
                    <Link href={isLoggedIn ? '/kitchen' : '/'}>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Image src="/Buffex-Banner-noback.png" alt="Buffex" height={32} width={120} priority />
                      </motion.div>
                    </Link>
                    <button
                      className="text-white/40 hover:text-white transition "
                      onClick={() => setDrawerOpen(false)}
                      aria-label="Cerrar menú"
                    >
                      <X className="w-8 h-8" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 p-4 flex-grow overflow-y-auto items-center">
                    <MobileMenuItem href="/kitchen" icon={<Plus />} label="Nueva Receta" onClick={() => setDrawerOpen(false)} />
                    <MobileMenuItem href="/kitchen/recipes/list" icon={<BookOpen />} label="Mis Recetas" onClick={() => setDrawerOpen(false)} />
                    <MobileMenuItem href="/profile" icon={<User />} label="Mi Perfil" onClick={() => setDrawerOpen(false)} />

                    {user && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="mt-8 p-6 rounded-xl shadow-xl text-white text-center w-full max-w-sm"
                        style={{ background: "#1a1a1a", border: "1px solid rgba(249,115,22,0.25)" }}
                      >
                        <h3 className="text-xl font-bold mb-3">{t("header.tokens.popup.title")}</h3>
                        <div className="space-y-2 mb-4">
                          <p className="flex justify-between items-center text-lg">
                            <span>{t("header.tokens.popup.monthly")}</span> <span className="font-bold text-[var(--highlight)]">{user?.monthly_recipes || 0}</span>
                          </p>
                          <p className="flex justify-between items-center text-lg">
                            <span>{t("header.tokens.popup.extra")}</span> <span className="font-bold text-[var(--highlight)]">{user?.extra_recipes || 0}</span>
                          </p>
                        </div>
                        <p className="text-sm italic mb-4">
                          {t("header.tokens.popup.total")}: <span className="font-bold text-[var(--highlight)] text-xl">
                            {`${totalRecipes} ${t("header.tokens.recipes", { count: totalRecipes })}`}
                          </span>
                        </p>
                        <button onClick={() => { setDrawerOpen(false); setShowTokens(true); }} className="w-full">
                          <motion.div
                            className="w-full py-3 rounded-full text-lg font-bold shadow-lg transition-all duration-300
                                       bg-gradient-to-r from-[var(--highlight)] to-[var(--highlight-dark)] text-[var(--text2)]
                                       hover:from-[var(--highlight-dark)] hover:to-[var(--highlight)] focus:outline-none focus:ring-4 focus:ring-[var(--highlight)] text-center"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            role="button"
                            tabIndex={0}
                          >
                            {t("header.tokens.buy")}
                          </motion.div>
                        </button>
                        {/* Botón para el modal de Premium en móvil */}
                        <motion.button
                          onClick={() => {
                            setShowTokens(true);
                            setDrawerOpen(false);
                          }}
                          className="w-full py-3 mt-4 rounded-full text-lg font-bold shadow-lg transition-all duration-300
                                     bg-gradient-to-r from-yellow-400 to-yellow-600 text-white
                                     hover:from-yellow-500 hover:to-yellow-700 focus:outline-none focus:ring-4 focus:ring-yellow-500 text-center"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          role="button"
                          tabIndex={0}
                        >
                          {user?.isSubscribed ? t("header.tokens.premium.currentPlan") : t("header.tokens.premium.subscribeButton")}
                        </motion.button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Contenido del Header para escritorio o móvil en otras páginas */}
        {!isMobileProfilePage && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href={isLoggedIn ? '/kitchen' : '/'}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <Image src="/Buffex-Banner-noback.png" alt="Buffex" height={32} width={120} priority />
                </motion.div>
              </Link>

              <nav className="flex items-center gap-6">
                <ul className="hidden md:flex items-center gap-6">
                  <li>
                    <Link href={isLoggedIn ? '/kitchen' : '/'} passHref>
                      <motion.span
                        className={`text-white/60 hover:text-white font-medium transition-colors duration-200 cursor-pointer
                          ${pathname === (isLoggedIn ? '/kitchen' : '/') ? 'text-white underline decoration-[#f97316] underline-offset-4' : ''
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {t("header.menu.home")}
                      </motion.span>
                    </Link>
                  </li>
                  {isLoggedIn && (
                    <li>
                      <Link href="/profile" passHref>
                        <motion.span
                          className={`text-white/60 hover:text-white font-medium transition-colors duration-200 cursor-pointer
                            ${pathname === '/profile' ? 'text-white underline decoration-[#f97316] underline-offset-4' : ''
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {t("header.menu.myProfile")}
                        </motion.span>
                      </Link>
                    </li>
                  )}
                </ul>

                {!isLoggedIn && (
                  <motion.button
                    onClick={openAuthModal}
                    className={specialButtonClasses}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {t("header.auth.getStarted")}
                  </motion.button>
                )}

                {isLoggedIn && (
                  <div
                    className={`relative flex items-center p-2 rounded-full cursor-pointer transition-all duration-200 ${
                      isLowRecipes ? 'animate-pulse-glow' : ''
                    }`}
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                    onMouseEnter={() => setShowTokensPopup(true)}
                    onMouseLeave={() => setShowTokensPopup(false)}
                  >
                    <span className="text-white font-semibold text-sm md:text-base mr-2">
                      {t("header.tokens.recipes", { count: totalRecipes })}
                    </span>
                    <Sparkles className="w-5 h-5 text-[var(--highlight)]" aria-label="Recetas disponibles" />

                    {/* El popup de tokens, solo visible en escritorio */}
                    {showTokensPopup && !isMobile && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 p-4
                                   bg-white rounded-2xl z-50 text-[#111111]"
                        style={{ border: "1px solid #E5E5E3", boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}
                      >
                        <h3 className="text-lg font-bold mb-2 text-center">{t("header.tokens.popup.title")}</h3>
                        <div className="space-y-2">
                          <p className="flex justify-between items-center text-sm">
                            <span>{t("header.tokens.popup.monthly")}</span> <span className="font-bold text-[var(--highlight)]">{user?.monthly_recipes || 0}</span>
                          </p>
                          <p className="flex justify-between items-center text-sm">
                            <span>{t("header.tokens.popup.extra")}</span> <span className="font-bold text-[var(--highlight)]">{user?.extra_recipes || 0}</span>
                          </p>
                        </div>
                        <div className="h-px my-3" style={{ background: "#E5E5E3" }} />
                        <p className="flex justify-between items-center text-base font-semibold">
                          <span>{t("header.tokens.popup.total")}</span>
                          <span className="text-[var(--highlight)] font-bold">
                            {t("header.tokens.recipes", { count: totalRecipes })}
                          </span>
                        </p>
                        <motion.button
                          onClick={() => {
                            setShowTokensPopup(false);
                            setShowTokens(true);
                          }}
                          className="mt-4 w-full py-2 text-sm font-bold shadow-md text-center rounded-full transition-all duration-300
                                     bg-gradient-to-r from-[var(--highlight)] to-[var(--highlight-dark)] text-[var(--text2)]
                                     hover:from-[var(--highlight-dark)] hover:to-[var(--highlight)]"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {t("header.tokens.buyMore")}
                        </motion.button>

                        {/* Botón de suscripción Premium (sólo si no está suscrito) */}
                        {user && !user.isSubscribed && (
                          <motion.button
                            onClick={() => {
                              setShowTokensPopup(false);
                              setShowTokens(true);
                            }}
                            className="mt-2 w-full py-2 text-sm font-bold shadow-md text-center rounded-full transition-all duration-300
                                       bg-gradient-to-r from-yellow-400 to-yellow-600 text-white
                                       hover:from-yellow-500 hover:to-yellow-700"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {t("header.tokens.premium.subscribeButton")}
                          </motion.button>
                        )}
                      </motion.div>
                    )}
                  </div>
                )}
              </nav>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import AuthModal from "@/components/AuthModal";

interface AuthModalContextType {
  openAuthModal: () => void;
  closeAuthModal: () => void;
  isOpen: boolean;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openAuthModal = () => setIsOpen(true);
  const closeAuthModal = () => setIsOpen(false);

  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal, isOpen }}>
      {children}
      {isOpen && <AuthModal onClose={closeAuthModal} />}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error("useAuthModal debe ser usado dentro de un AuthModalProvider");
  }
  return context;
}

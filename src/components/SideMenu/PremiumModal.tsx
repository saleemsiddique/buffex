"use client";

// Thin wrapper — redirects all callers to the unified TokensModal.
// Kept for import compatibility during gradual migration.
import React from "react";
import { CustomUser } from "@/context/user-context";
import { TokensModal } from "./TokensModal";

interface PremiumModalProps {
  onClose: () => void;
  onSubscribe?: () => void;
  user: CustomUser | null;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({ onClose, user }) => (
  <TokensModal onClose={onClose} user={user} />
);

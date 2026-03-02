"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  doc,
  setDoc,
  updateDoc,
  Timestamp,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  confirmPasswordReset as firebaseConfirmPasswordReset,
  User as FirebaseUser,
} from "firebase/auth";
import i18n from "@/lib/i18n";

export interface CustomUser {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  created_at: Timestamp;
  monthly_recipes: number;
  extra_recipes: number;
  isSubscribed: boolean;
  lastRenewal: Timestamp;
  stripeCustomerId: string;
  subscriptionId: string;
  subscriptionStatus: string;
  subscriptionCanceled: boolean;
  newsletterConsent?: boolean;
  lastNewsletterConsentAt?: Timestamp | null;
  lastNewsletterConsentCanceledAt?: Timestamp | null;
  last_active: Timestamp;
}

interface UserContextType {
  user: CustomUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    surname: string
  ) => Promise<string>;
  loginWithGoogle: () => Promise<{ user: CustomUser | null; isNewUser: boolean }>;
  logout: () => Promise<void>;
  updateUserName: (newName: string) => Promise<void>;
  deductTokens: (amount: number) => Promise<void>;
  hasEnoughTokens: (amount: number) => boolean;
  refreshUser: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  confirmPasswordReset: (oobCode: string, newPassword: string) => Promise<void>;
  setNewsletterConsent: (subscribe: boolean) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);


export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Verifica y resetea recetas mensuales si han pasado 30 días
  const checkAndResetMonthlyRecipes = async (userData: CustomUser): Promise<CustomUser> => {
    // Solo verificar para usuarios sin suscripción activa
    if (userData.isSubscribed && (userData.subscriptionStatus === 'active' || userData.subscriptionStatus === 'cancel_at_period_end')) {
      return userData;
    }

    const now = Timestamp.now();
    const resetDate = userData.lastRenewal;

    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const timeDiff = now.toMillis() - resetDate.toMillis();

    if (timeDiff >= thirtyDaysInMs) {
      try {
        const userDocRef = doc(db, "user", userData.uid);
        const newResetDate = Timestamp.now();

        await updateDoc(userDocRef, {
          monthly_recipes: 5,
          lastRenewal: newResetDate,
        });

        return {
          ...userData,
          monthly_recipes: 5,
          lastRenewal: newResetDate,
        };
      } catch (error) {
        console.error("Error al resetear recetas:", error);
        return userData;
      }
    }

    return userData;
  };

  const updateLastActive = async (uid: string) => {
    try {
      const userDocRef = doc(db, "user", uid);
      await updateDoc(userDocRef, {
        last_active: Timestamp.now(),
      });
    } catch (err) {
      console.error("Error updating last active:", err);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (userAuth) => {
      setFirebaseUser(userAuth);
      if (userAuth?.email) {
        const userDocRef = doc(db, "user", userAuth.uid);
        const userSnapshot = await getDoc(userDocRef);

        if (userSnapshot.exists()) {
          let docData = userSnapshot.data() as CustomUser;
          docData.uid = userSnapshot.id;

          docData = await checkAndResetMonthlyRecipes(docData);

          setUser(docData);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUser = useCallback(async () => {
    if (!firebaseUser?.email) {
      console.warn("No hay usuario autenticado para refrescar");
      return;
    }

    try {
      const userDocRef = doc(db, "user", firebaseUser.uid);
      const userSnapshot = await getDoc(userDocRef);

      if (userSnapshot.exists()) {
        const docData = userSnapshot.data() as CustomUser;
        docData.uid = userSnapshot.id;
        setUser(docData);
      } else {
        console.warn("No se encontró el usuario en la base de datos");
      }
    } catch (error) {
      console.error("Error al refrescar datos del usuario:", error);
    }
  }, [firebaseUser?.email, firebaseUser?.uid]);

  useEffect(() => {
    const handleTokenUpdate = () => {
      refreshUser().catch(console.error);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && firebaseUser?.email) {
        setTimeout(() => {
          refreshUser().catch(console.error);
        }, 1000);
      }
    };

    window.addEventListener('token_update', handleTokenUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('token_update', handleTokenUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [firebaseUser?.email, refreshUser]);

  const createStripeCustomer = async (email: string, userId: string) => {
    try {
      const response = await fetch("/api/create-stripe-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, userId }),
      });

      if (!response.ok) {
        throw new Error("Error al crear customer en Stripe");
      }

      const { customerId } = await response.json();
      return customerId;
    } catch (error) {
      console.error("Error creando Stripe customer:", error);
      throw error;
    }
  };

  const linkAnonymousConsent = async (fbUser: FirebaseUser) => {
    try {
      const stored = localStorage.getItem("buffex_cookie_consent");
      const anonymousId = stored ? JSON.parse(stored)?.user_id : null;
      if (anonymousId && anonymousId !== fbUser.uid) {
        const idToken = await fbUser.getIdToken();
        await fetch("/api/consent/link", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ anonymous_id: anonymousId }),
        });
      }
    } catch {
      // non-critical, silently ignore
    }
  };

  const login = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = result.user;

    const userDocRef = doc(db, "user", firebaseUser.uid);
    const snapshot = await getDoc(userDocRef);

    if (!snapshot.exists()) {
      throw new Error("Usuario no encontrado");
    }

    let docData = snapshot.data() as CustomUser;
    docData.uid = snapshot.id;

    docData = await checkAndResetMonthlyRecipes(docData);
    updateLastActive(firebaseUser.uid).catch(console.error);
    linkAnonymousConsent(firebaseUser).catch(console.error);

    setUser(docData);
  };

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const id = userCredential.user.uid;

      const stripeCustomerId = await createStripeCustomer(email, id);

      const newUser: Omit<CustomUser, "password"> = {
        uid: id,
        email,
        firstName,
        lastName,
        created_at: Timestamp.now(),
        monthly_recipes: 5,
        extra_recipes: 0,
        isSubscribed: false,
        lastRenewal: Timestamp.now(),
        stripeCustomerId: stripeCustomerId,
        subscriptionId: "",
        subscriptionStatus: "cancelled",
        subscriptionCanceled: false,
        last_active: Timestamp.now(),
      };

      const docRef = doc(db, "user", id);
      await setDoc(docRef, newUser);

      setUser(newUser);
      setFirebaseUser(userCredential.user);
      setLoading(false);

      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          type: "welcome",
          data: { firstName },
          lang: i18n.language
        }),
      });

      return id;
    } catch (error) {
      console.error("Error al registrarse:", error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const userInfo = result.user;

    const email = userInfo.email;
    if (!email) throw new Error("No se pudo obtener el email");

    const userDocRef = doc(db, "user", userInfo.uid);
    const userSnapshot = await getDoc(userDocRef);

    let userData: CustomUser;
    let isNewUser = false;

    if (!userSnapshot.exists()) {
      isNewUser = true;

      const stripeCustomerId = await createStripeCustomer(email, userInfo.uid);

      userData = {
        uid: userInfo.uid,
        email: email,
        firstName: userInfo.displayName?.split(" ")[0] || "",
        lastName: userInfo.displayName?.split(" ").slice(1).join(" ") || "",
        created_at: Timestamp.now(),
        monthly_recipes: 5,
        extra_recipes: 0,
        isSubscribed: false,
        lastRenewal: Timestamp.now(),
        stripeCustomerId: stripeCustomerId,
        subscriptionId: "",
        subscriptionStatus: "cancelled",
        subscriptionCanceled: false,
        last_active: Timestamp.now(),
      };

      const docRef = doc(db, "user", userInfo.uid);
      await setDoc(docRef, userData);
    } else {
      userData = userSnapshot.data() as CustomUser;
      userData.uid = userSnapshot.id;
      userData = await checkAndResetMonthlyRecipes(userData);
      updateLastActive(userData.uid).catch(console.error);
    }

    setUser(userData);
    linkAnonymousConsent(userInfo).catch(console.error);

    return { user: userData, isNewUser };
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const updateUserName = async (newName: string) => {
    if (!user) throw new Error("No hay usuario autenticado");
    if (!newName.trim()) throw new Error("El nombre no puede estar vacío");

    try {
      const userDocRef = doc(db, "user", user.uid);
      await updateDoc(userDocRef, { firstName: newName.trim() });

      setUser((prevUser) => {
        if (!prevUser) return null;
        return { ...prevUser, firstName: newName.trim() };
      });
    } catch (error) {
      console.error("Error al actualizar el nombre:", error);
      throw new Error("No se pudo actualizar el nombre");
    }
  };

  // Verifica si el usuario tiene suficientes recetas disponibles
  const hasEnoughTokens = (amount: number) => {
    if (!user) return false;
    const totalRecipes = (user.monthly_recipes || 0) + (user.extra_recipes || 0);
    return totalRecipes >= amount;
  };

  // Descuenta recetas via API con transacción Firestore
  const deductTokens = async (amount: number) => {
    if (!user || !firebaseUser) throw new Error("No hay usuario autenticado");
    if (!hasEnoughTokens(amount)) throw new Error("Recetas insuficientes");

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/deduct-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al descontar receta');
      }

      const { updatedUser } = await response.json();

      setUser((prevUser) => {
        if (!prevUser) return null;
        return {
          ...prevUser,
          monthly_recipes: updatedUser.monthly_recipes,
          extra_recipes: updatedUser.extra_recipes,
        };
      });

      setTimeout(() => {
        refreshUser().catch(console.error);
      }, 100);
    } catch (error) {
      console.error("Error al descontar receta:", error);
      throw error;
    }
  };

  const setNewsletterConsent = async (subscribe: boolean) => {
    if (!firebaseUser) {
      console.warn("No hay firebaseUser para actualizar newsletter");
      return;
    }

    try {
      const userDocRef = doc(db, "user", firebaseUser.uid);

      if (subscribe) {
        await updateDoc(userDocRef, {
          newsletterConsent: true,
          lastNewsletterConsentAt: serverTimestamp(),
          lastNewsletterConsentCanceledAt: null,
        });

        setUser(prev => prev ? ({
          ...prev,
          newsletterConsent: true,
          lastNewsletterConsentAt: Timestamp.now(),
          lastNewsletterConsentCanceledAt: null,
        }) : prev);
      } else {
        await updateDoc(userDocRef, {
          newsletterConsent: false,
          lastNewsletterConsentCanceledAt: serverTimestamp(),
        });

        setUser(prev => prev ? ({
          ...prev,
          newsletterConsent: false,
          lastNewsletterConsentCanceledAt: Timestamp.now(),
        }) : prev);
      }
    } catch (err) {
      console.error("Error actualizando newsletterConsent:", err);
      throw err;
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    try {
      await firebaseSendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Error sending password reset email:", error);
      throw error;
    }
  };

  const confirmPasswordReset = async (oobCode: string, newPassword: string) => {
    try {
      await firebaseConfirmPasswordReset(auth, oobCode, newPassword);
    } catch (error) {
      console.error("Error confirming password reset:", error);
      throw error;
    }
  };

  const value: UserContextType = {
    user,
    firebaseUser,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    updateUserName,
    deductTokens,
    hasEnoughTokens,
    refreshUser,
    sendPasswordResetEmail,
    confirmPasswordReset,
    setNewsletterConsent
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser debe ser usado dentro de un UserProvider");
  }
  return context;
}

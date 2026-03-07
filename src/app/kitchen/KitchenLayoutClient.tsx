"use client";

import React, { ReactNode, useEffect } from 'react';
import SideMenu from '@/components/side-menu';
import { useUser } from '@/context/user-context';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface KitchenLayoutClientProps {
  children: ReactNode;
}

export default function KitchenLayoutClient({ children }: KitchenLayoutClientProps) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full">
        <Loader2 className="h-12 w-12 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex w-full h-full">
      <SideMenu />
      <main className="w-full h-full overflow-auto md:ml-20">
        {children}
      </main>
    </div>
  );
}

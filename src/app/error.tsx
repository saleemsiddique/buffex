'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--background)] text-center px-4">
      <div className="mb-4 text-[var(--highlight)]"><AlertCircle size={56} strokeWidth={1.5} /></div>
      <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
        Algo salió mal
      </h2>
      <p className="text-gray-500 mb-6 max-w-sm">
        Ha ocurrido un error inesperado. Por favor inténtalo de nuevo.
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 rounded-full font-semibold bg-gradient-to-r from-[var(--highlight)] to-[var(--highlight-dark)] text-white hover:opacity-90 transition-opacity"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}

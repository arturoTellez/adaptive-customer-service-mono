'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-kavak-navy">
      <div className="text-center">
        <div className="w-20 h-20 border-4 border-kavak-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Cargando Kavak Soporte...</p>
      </div>
    </div>
  );
}
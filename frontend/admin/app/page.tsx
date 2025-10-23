'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirigir según el rol
        if (isAdmin) {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, isAdmin, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-kavak-navy via-kavak-blue to-kavak-navy">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-kavak-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white">Cargando...</p>
      </div>
    </div>
  );
}
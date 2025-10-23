'use client';

import { useAuth } from '@/app/lib/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Mis Tickets', path: '/tickets' },
    { name: 'Nuevo Ticket', path: '/tickets/new' },
  ];

  return (
    <nav className="bg-white border-b border-kavak-gray-100 sticky top-0 z-50 backdrop-blur-lg bg-white/95">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 bg-gradient-to-br from-kavak-navy to-kavak-blue rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all group-hover:scale-105">
              <span className="text-white text-xl font-bold">K</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-kavak-navy text-xl font-bold">Kavak</span>
              <p className="text-kavak-gray-500 text-xs -mt-1">Soporte</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                  pathname === item.path
                    ? 'bg-kavak-navy text-white shadow-lg'
                    : 'text-kavak-gray-700 hover:bg-kavak-gray-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-kavak-navy">{user?.name}</p>
                <p className="text-xs text-kavak-gray-500">{user?.email}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-kavak-orange to-kavak-orange-light rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                {user?.name?.charAt(0)}
              </div>
            </div>
            <button
              onClick={logout}
              className="bg-kavak-navy hover:bg-kavak-blue text-white px-5 py-2.5 rounded-xl font-medium transition-all hover:shadow-lg"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
'use client';

import { useAuth } from '../context/AuthContext';
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
    <nav className="bg-white shadow-lg border-b-4 border-kavak-orange">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-kavak-navy rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">K</span>
              </div>
              <span className="text-kavak-navy text-xl font-bold">Kavak Soporte</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex ml-10 space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    pathname === item.path
                      ? 'bg-kavak-orange text-white'
                      : 'text-kavak-gray-700 hover:bg-kavak-gray-100'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-kavak-navy">{user?.name}</p>
              <p className="text-xs text-kavak-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="bg-kavak-navy hover:bg-kavak-blue text-white px-4 py-2 rounded-lg font-medium transition-all"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
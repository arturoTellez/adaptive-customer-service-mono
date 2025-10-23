'use client';

import { useAuth } from '@/app/lib/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const pathname = usePathname();

  // Navegación para usuarios normales
  const userNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Mis Tickets', path: '/tickets', icon: '🎫' },
    { name: 'Nuevo Ticket', path: '/tickets/new', icon: '➕' },
  ];

  // Navegación para administradores
  const adminNavItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: '📈' },
    { name: 'Usuarios', path: '/admin/users', icon: '👥' },
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;
  const basePath = isAdmin ? '/admin/dashboard' : '/dashboard';

  return (
    <nav className={`border-b sticky top-0 z-50 backdrop-blur-lg bg-white/95 ${
      isAdmin 
        ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200' 
        : 'bg-white border-kavak-gray-100'
    }`}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href={basePath} className="flex items-center space-x-3 group">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all group-hover:scale-105 ${
              isAdmin
                ? 'bg-gradient-to-br from-purple-600 to-blue-600'
                : 'bg-gradient-to-br from-kavak-navy to-kavak-blue'
            }`}>
              <span className="text-white text-xl font-bold">
                {isAdmin ? '⚙️' : 'K'}
              </span>
            </div>
            <div className="hidden sm:block">
              <span className="text-kavak-navy text-xl font-bold">
                Kavak {isAdmin && 'Admin'}
              </span>
              <p className={`text-xs -mt-1 ${
                isAdmin ? 'text-purple-600 font-semibold' : 'text-kavak-gray-500'
              }`}>
                {isAdmin ? 'Panel de Administración' : 'Soporte'}
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  pathname === item.path
                    ? isAdmin
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                      : 'bg-kavak-navy text-white shadow-lg'
                    : isAdmin
                    ? 'text-purple-700 hover:bg-purple-100'
                    : 'text-kavak-gray-700 hover:bg-kavak-gray-50'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Admin Badge */}
            {isAdmin && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg border border-purple-300">
                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-bold text-purple-700">ADMIN</span>
              </div>
            )}

            {/* User Info */}
            <div className="hidden lg:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-kavak-navy">{user?.name}</p>
                <p className="text-xs text-kavak-gray-500">{user?.email}</p>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                isAdmin
                  ? 'bg-gradient-to-br from-purple-500 to-blue-500'
                  : 'bg-gradient-to-br from-kavak-orange to-kavak-orange-light'
              }`}>
                {user?.name?.charAt(0)}
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all hover:shadow-lg ${
                isAdmin
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                  : 'bg-kavak-navy hover:bg-kavak-blue text-white'
              }`}
            >
              Salir
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Optional */}
      <div className="md:hidden border-t border-kavak-gray-100 px-4 py-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all ${
                pathname === item.path
                  ? isAdmin
                    ? 'text-purple-600 bg-purple-50'
                    : 'text-kavak-orange bg-orange-50'
                  : 'text-kavak-gray-600'
              }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
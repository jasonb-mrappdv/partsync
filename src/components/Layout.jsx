import { Link, Outlet, useLocation } from 'react-router-dom';
import { Bell, Settings, Package, LayoutDashboard, ShoppingCart, RotateCcw, Building2, BarChart3, ChevronDown } from 'lucide-react';

const navLinks = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Order Status', path: '/orders', icon: ShoppingCart },
  { label: 'Returns & Log', path: '/returns', icon: RotateCcw },
  { label: 'Vendor Mgmt', path: '/vendors', icon: Building2 },
  { label: 'Reports', path: '/reports', icon: BarChart3 },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen font-inter" style={{ backgroundColor: '#0D1B2A' }}>
      {/* Top Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/10" style={{ backgroundColor: '#0a1628' }}>
        <div className="flex items-center justify-between px-6 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: '#3B82F6' }}>
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">PartFlow<span style={{ color: '#3B82F6' }}>Pro</span></span>
          </div>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {navLinks.map(({ label, path }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className="px-4 py-2 rounded text-sm font-medium transition-all"
                  style={{
                    color: isActive ? '#3B82F6' : '#94a3b8',
                    borderBottom: isActive ? '2px solid #3B82F6' : '2px solid transparent',
                    borderRadius: 0,
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
              <Bell className="w-5 h-5 text-slate-400" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: '#3B82F6' }}></span>
            </button>
            <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <Settings className="w-5 h-5 text-slate-400" />
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold" style={{ backgroundColor: '#1E3A5F' }}>
                A
              </div>
              <div className="hidden md:block">
                <p className="text-white text-sm font-medium leading-none">Admin</p>
                <p className="text-xs mt-0.5" style={{ color: '#3B82F6' }}>● Online</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
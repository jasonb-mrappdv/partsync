import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Bell, Settings, Package, LayoutDashboard, ShoppingCart, RotateCcw, Building2, BarChart3, Wrench, Store } from 'lucide-react';

const adminLinks = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Order Status', path: '/orders', icon: ShoppingCart },
  { label: 'Returns & Log', path: '/returns', icon: RotateCcw },
  { label: 'Vendor Mgmt', path: '/vendors', icon: Building2 },
  { label: 'Reports', path: '/reports', icon: BarChart3 },
];

const vendorLinks = [
  { label: 'My Orders', path: '/vendor-portal', icon: Store },
];

const technicianLinks = [
  { label: 'My Portal', path: '/technician-portal', icon: Wrench },
];

export default function Layout() {
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isVendorPath = location.pathname.startsWith('/vendor-portal');
  const isTechPath = location.pathname.startsWith('/technician-portal');

  let navLinks = adminLinks;
  let portalLabel = 'Admin Portal';
  if (user?.role === 'vendor') { navLinks = vendorLinks; portalLabel = 'Vendor Portal'; }
  else if (user?.role === 'technician') { navLinks = technicianLinks; portalLabel = 'Tech Portal'; }

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen font-inter bg-background">
      {/* Top Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-popover">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md flex items-center justify-center bg-primary">
              <Package className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-lg tracking-tight">PartFlow<span className="text-primary">Pro</span></span>
              <span className="hidden md:inline-block ml-2 text-xs text-muted-foreground border border-border px-1.5 py-0.5 rounded">{portalLabel}</span>
            </div>
          </div>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {navLinks.map(({ label, path }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className="px-4 py-2 text-sm font-medium transition-all"
                  style={{
                    color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                    borderBottom: isActive ? '2px solid hsl(var(--primary))' : '2px solid transparent',
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {user?.role === 'admin' && (
              <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary"></span>
              </button>
            )}
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold bg-secondary">
                {initials}
              </div>
              <div className="hidden md:block">
                <p className="text-white text-sm font-medium leading-none">{user?.full_name || user?.email || '...'}</p>
                <p className="text-xs mt-0.5 text-primary capitalize">● {user?.role || 'user'}</p>
              </div>
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
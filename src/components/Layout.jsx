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
          <div className="flex items-center gap-3">
            {/* Chain link icon */}
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 10.5C23.5 9 25.5 8 27.5 8C31.6 8 35 11.4 35 15.5C35 19.6 31.6 23 27.5 23L23 23C21.3 23 19.8 22.3 18.7 21.2" stroke="#F97316" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
              <path d="M14 25.5C12.5 27 10.5 28 8.5 28C4.4 28 1 24.6 1 20.5C1 16.4 4.4 13 8.5 13L13 13C14.7 13 16.2 13.7 17.3 14.8" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
              <path d="M13 20.5L23 15.5" stroke="#F97316" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
            </svg>
            <div>
              <div className="flex items-baseline gap-0">
                <span className="text-white font-extrabold text-xl tracking-tight leading-none">PartFlow</span>
                <span className="text-[#F97316] font-extrabold text-xl tracking-tight leading-none">Pro</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[#F97316] font-bold text-[10px] tracking-widest uppercase leading-none">B2B</span>
                <span className="text-white/60 text-[10px] tracking-wide leading-none">Parts Link</span>
                <span className="hidden md:inline-block ml-1 text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded">{portalLabel}</span>
              </div>
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
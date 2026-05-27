import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { LayoutDashboard, ShoppingCart, RotateCcw, Building2, BarChart3, Wrench, Store } from 'lucide-react';

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
        <div className="flex items-center justify-between px-6 h-16">

          {/* Logo */}
          <div className="flex items-center gap-3 min-w-[180px]">
            {/* Chain link SVG — two clearly interlocking oval rings */}
            <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Link 1 (orange) — horizontal oval, top-left */}
              <ellipse cx="13" cy="14" rx="10" ry="5.5" stroke="#F97316" strokeWidth="3" fill="none" transform="rotate(-30 13 14)"/>
              {/* Link 2 (white) — horizontal oval, bottom-right, overlapping center */}
              <ellipse cx="25" cy="24" rx="10" ry="5.5" stroke="white" strokeWidth="3" fill="none" transform="rotate(-30 25 24)"/>
              {/* Overlap mask so links appear to interlock — bottom of link1 hidden behind link2 */}
              <ellipse cx="25" cy="24" rx="10" ry="5.5" stroke="hsl(210,28%,15%)" strokeWidth="3" fill="none"
                transform="rotate(-30 25 24)"
                strokeDasharray="10 100"
                strokeDashoffset="-23"
              />
            </svg>
            <div>
              <div className="flex items-baseline">
                <span className="text-white font-extrabold text-lg tracking-tight leading-none">PartFlow</span>
                <span className="text-[#F97316] font-extrabold text-lg tracking-tight leading-none">Pro</span>
              </div>
              <p className="text-[10px] text-white/50 tracking-widest uppercase mt-0.5 leading-none">B2B Parts Link</p>
            </div>
          </div>

          {/* Nav Links — centered */}
          <div className="flex items-center gap-0">
            {navLinks.map(({ label, path }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className="px-4 h-16 flex items-center text-sm font-medium transition-colors border-b-2"
                  style={{
                    color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                    borderBottomColor: isActive ? 'hsl(var(--primary))' : 'transparent',
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right side — portal label + user */}
          <div className="flex items-center gap-4 min-w-[180px] justify-end">
            <span className="hidden md:block text-[11px] text-muted-foreground border border-border/60 px-2.5 py-1 rounded-md whitespace-nowrap">
              {portalLabel}
            </span>
            <div className="flex items-center gap-2.5 border-l border-border pl-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold bg-secondary shrink-0">
                {initials}
              </div>
              <div className="hidden md:block">
                <p className="text-white text-sm font-medium leading-tight">{user?.full_name || user?.email || '...'}</p>
                <p className="text-[11px] text-primary capitalize leading-tight">{user?.role || 'user'}</p>
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
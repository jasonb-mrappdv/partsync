import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
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
  const { user } = useAuth();

  const isVendorPath = location.pathname.startsWith('/vendor-portal');
  const isTechPath = location.pathname.startsWith('/technician-portal');

  let navLinks = adminLinks;
  let portalLabel = 'Admin Portal';
  if (user?.role === 'vendor') { navLinks = vendorLinks; portalLabel = 'Vendor Portal'; }
  else if (user?.role === 'technician') { navLinks = technicianLinks; portalLabel = 'User Portal'; }



  return (
    <div className="min-h-screen font-inter bg-background">
      {/* Top Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-popover">
        <div className="flex items-center justify-between px-6 h-16">

          {/* Logo — uses the provided brand image directly */}
          <Link to="/" className="flex items-center shrink-0" aria-label="PartFlowPro — B2B Parts Link">
            <img src="/brand.png" alt="PartFlowPro — B2B Parts Link" className="h-10 w-auto select-none shrink-0" draggable={false} />
          </Link>

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

          {/* Right side — user email + portal label */}
          <div className="flex flex-col items-end min-w-[220px] justify-center">
            <p className="text-white text-sm font-medium whitespace-nowrap">{user?.email || '...'}</p>
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">{portalLabel}</span>
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
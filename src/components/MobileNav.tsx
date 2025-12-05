import { NavLink as RouterNavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Home, Trophy, Upload, Bell, User, FileText, Settings } from 'lucide-react';

const partnerNavItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/leaderboard', icon: Trophy, label: 'Rankings' },
  { to: '/submit', icon: Upload, label: 'Submit' },
  { to: '/notifications', icon: Bell, label: 'Alerts' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const adminNavItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/contributions', icon: FileText, label: 'Contributions' },
  { to: '/notifications', icon: Bell, label: 'Alerts' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function MobileNav() {
  const { isAdmin } = useAuth();
  const navItems = isAdmin ? adminNavItems : partnerNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border lg:hidden">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <RouterNavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center w-full h-full gap-1 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </RouterNavLink>
        ))}
      </div>
    </nav>
  );
}

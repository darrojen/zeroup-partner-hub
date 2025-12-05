import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { 
  Home, 
  Trophy, 
  Upload, 
  Bell, 
  User, 
  Settings,
  FileText,
  LogOut
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const partnerNavItems = [
  { to: '/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/submit', icon: Upload, label: 'Submit' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const adminNavItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/contributions', icon: FileText, label: 'Contributions' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function AppSidebar() {
  const { partner, isAdmin, user } = useAuth();
  const location = useLocation();
  const navItems = isAdmin ? adminNavItems : partnerNavItems;

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card h-screen sticky top-0">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-semibold text-foreground">ZeroUp</h1>
        <p className="text-xs text-muted-foreground mt-1">Partners Portal</p>
      </div>

      {/* User Profile Summary */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={partner?.avatar_url || ''} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {getInitials(partner?.full_name || user?.email || 'U')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {partner?.full_name || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {isAdmin ? 'Administrator' : partner?.rank ? `${partner.rank.replace('_', ' ')} Partner` : 'Partner'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          <span>Log out</span>
        </Button>
      </div>
    </aside>
  );
}

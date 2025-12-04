import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, Trophy, Upload, Bell, User } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/submit', icon: Upload, label: 'Submit' },
  { to: '/notifications', icon: Bell, label: 'Alerts' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 safe-area-pb">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all duration-200',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  'relative p-1.5 rounded-xl transition-all duration-200',
                  isActive && 'bg-primary/20'
                )}>
                  <Icon className={cn('w-5 h-5', to === '/submit' && isActive && 'animate-pulse')} />
                  {isActive && (
                    <div className="absolute inset-0 rounded-xl bg-primary/10 blur-lg" />
                  )}
                </div>
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

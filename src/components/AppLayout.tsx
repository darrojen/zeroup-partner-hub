import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppSidebar } from './AppSidebar';
import { MobileNav } from './MobileNav';
import { Loader2 } from 'lucide-react';

export function AppLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex w-full">
      <AppSidebar />
      <main className="flex-1 pb-20 lg:pb-6">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>
      <MobileNav />
    </div>
  );
}

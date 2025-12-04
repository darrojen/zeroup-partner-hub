import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Calendar, Award, LogOut, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { partner, signOut, isAdmin } = useAuth();

  const { data: ranks } = useQuery({
    queryKey: ['ranks'],
    queryFn: async () => {
      const { data } = await supabase.from('ranks').select('*').order('min_score', { ascending: true });
      return data || [];
    },
  });

  const { data: contributionStats } = useQuery({
    queryKey: ['contribution-stats', partner?.id],
    queryFn: async () => {
      if (!partner?.id) return null;
      const { data } = await supabase.from('contributions').select('status').eq('partner_id', partner.id);
      const total = data?.length || 0;
      const approved = data?.filter((c) => c.status === 'approved').length || 0;
      const pending = data?.filter((c) => c.status === 'pending').length || 0;
      return { total, approved, pending };
    },
    enabled: !!partner?.id,
  });

  const nextRank = ranks?.find((r) => r.min_score > (partner?.impact_score || 0));
  const progressToNextRank = nextRank ? Math.min(100, ((partner?.impact_score || 0) / nextRank.min_score) * 100) : 100;

  return (
    <div className="space-y-6">
      <header className="text-center">
        <Avatar className="w-20 h-20 mx-auto border-2 border-border">
          <AvatarImage src={partner?.avatar_url || undefined} />
          <AvatarFallback className="text-xl bg-primary text-primary-foreground">
            {partner?.full_name?.charAt(0)?.toUpperCase() || 'P'}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-xl font-semibold mt-4">{partner?.full_name}</h1>
        <p className="text-sm text-muted-foreground">{partner?.email}</p>
        <span className="inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full bg-secondary capitalize">{partner?.rank}</span>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center border shadow-sm">
          <CardContent className="p-4">
            <p className="text-2xl font-semibold">{contributionStats?.total || 0}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="text-center border shadow-sm">
          <CardContent className="p-4">
            <p className="text-2xl font-semibold text-success">{contributionStats?.approved || 0}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card className="text-center border shadow-sm">
          <CardContent className="p-4">
            <p className="text-2xl font-semibold text-warning">{contributionStats?.pending || 0}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {nextRank && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Award className="w-4 h-4" /> Rank Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${progressToNextRank}%` }} />
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              {partner?.impact_score || 0} / {nextRank.min_score} points to {nextRank.rank_name.replace('_', ' ')}
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Profile Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Full Name</p>
              <p className="font-medium text-sm">{partner?.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
              <Mail className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium text-sm">{partner?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Member Since</p>
              <p className="font-medium text-sm">{partner?.created_at ? format(new Date(partner.created_at), 'MMMM yyyy') : 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardContent className="p-2">
          <Button variant="ghost" className="w-full justify-between h-12 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={signOut}>
            <span className="flex items-center gap-3"><LogOut className="w-4 h-4" />Sign Out</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

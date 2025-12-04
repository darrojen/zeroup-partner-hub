import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RankBadge, RankIcon } from '@/components/RankBadge';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Award, 
  LogOut, 
  ChevronRight,
  Shield,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const { partner, user, signOut, isAdmin } = useAuth();

  const { data: ranks } = useQuery({
    queryKey: ['ranks'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ranks')
        .select('*')
        .order('min_score', { ascending: true });
      return data || [];
    },
  });

  const { data: contributionStats } = useQuery({
    queryKey: ['contribution-stats', partner?.id],
    queryFn: async () => {
      if (!partner?.id) return null;
      const { data } = await supabase
        .from('contributions')
        .select('status')
        .eq('partner_id', partner.id);
      
      const total = data?.length || 0;
      const approved = data?.filter((c) => c.status === 'approved').length || 0;
      const pending = data?.filter((c) => c.status === 'pending').length || 0;
      
      return { total, approved, pending };
    },
    enabled: !!partner?.id,
  });

  const currentRank = ranks?.find((r) => r.rank_name === partner?.rank);
  const nextRank = ranks?.find(
    (r) => r.min_score > (partner?.impact_score || 0)
  );
  const progressToNextRank = nextRank
    ? Math.min(
        100,
        ((partner?.impact_score || 0) / nextRank.min_score) * 100
      )
    : 100;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <header className="text-center">
        <div className="relative inline-block">
          <Avatar className="w-24 h-24 border-4 border-primary/30">
            <AvatarImage src={partner?.avatar_url || undefined} />
            <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-amber-500 text-primary-foreground">
              {partner?.full_name?.charAt(0)?.toUpperCase() || 'P'}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1">
            <RankBadge rank={partner?.rank || 'bronze'} size="sm" showLabel={false} />
          </div>
        </div>
        <h1 className="text-2xl font-bold mt-4">{partner?.full_name}</h1>
        <p className="text-sm text-muted-foreground">{partner?.email}</p>
        <div className="mt-2">
          <RankBadge rank={partner?.rank || 'bronze'} />
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-gradient-gold">
              {contributionStats?.total || 0}
            </p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-success">
              {contributionStats?.approved || 0}
            </p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-warning">
              {contributionStats?.pending || 0}
            </p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Rank Progress */}
      {nextRank && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              Rank Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {currentRank?.rank_name?.replace('_', ' ').toUpperCase()}
                </span>
                <span className="text-muted-foreground">
                  {nextRank?.rank_name?.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="relative h-3 rounded-full bg-secondary overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressToNextRank}%` }}
                />
              </div>
              <p className="text-xs text-center text-muted-foreground">
                {partner?.impact_score || 0} / {nextRank.min_score} points to next rank
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Profile Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Full Name</p>
              <p className="font-medium">{partner?.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary">
              <Mail className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium">{partner?.email}</p>
            </div>
          </div>
          {partner?.phone && (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary">
                <Phone className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium">{partner.phone}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary">
              <Calendar className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Member Since</p>
              <p className="font-medium">
                {partner?.created_at
                  ? format(new Date(partner.created_at), 'MMMM yyyy')
                  : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="p-2">
          {isAdmin && (
            <Link to="/admin">
              <Button variant="ghost" className="w-full justify-between h-14">
                <span className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary" />
                  Admin Dashboard
                </span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            className="w-full justify-between h-14 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <span className="flex items-center gap-3">
              <LogOut className="w-5 h-5" />
              Sign Out
            </span>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

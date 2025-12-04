import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RankBadge } from '@/components/RankBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Award, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

type Period = 'weekly' | 'monthly' | 'all_time';

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>('monthly');
  const { partner } = useAuth();

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: async () => {
      // Fetch all partners ordered by total contributions for now
      const { data } = await supabase
        .from('partners')
        .select('*')
        .order('total_contributions', { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-slate-300" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-muted-foreground font-bold">{position}</span>;
    }
  };

  const getPositionBg = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-slate-400/20 to-slate-500/10 border-slate-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-700/10 border-amber-600/30';
      default:
        return 'bg-secondary/50 border-border/50';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <header className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-amber-500 shadow-gold mb-3">
          <Trophy className="w-7 h-7 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">Top contributing partners</p>
      </header>

      {/* Period Filter */}
      <div className="flex gap-2 p-1 rounded-xl bg-secondary/50">
        {(['weekly', 'monthly', 'all_time'] as Period[]).map((p) => (
          <Button
            key={p}
            variant={period === p ? 'default' : 'ghost'}
            size="sm"
            className={cn(
              'flex-1 capitalize',
              period === p && 'bg-primary text-primary-foreground'
            )}
            onClick={() => setPeriod(p)}
          >
            {p.replace('_', ' ')}
          </Button>
        ))}
      </div>

      {/* Current User Position */}
      {partner && leaderboard && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20">
                <span className="font-bold text-primary">
                  #{leaderboard.findIndex((p) => p.id === partner.id) + 1 || '?'}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-semibold">Your Position</p>
                <p className="text-sm text-muted-foreground">
                  ${partner.total_contributions.toLocaleString()} contributed
                </p>
              </div>
              <RankBadge rank={partner.rank} size="sm" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-secondary/50 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard?.map((p, index) => (
                <div
                  key={p.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:scale-[1.01]',
                    getPositionBg(index + 1),
                    p.id === partner?.id && 'ring-2 ring-primary'
                  )}
                >
                  <div className="flex items-center justify-center w-8">
                    {getPositionIcon(index + 1)}
                  </div>
                  <Avatar className="w-10 h-10 border-2 border-border">
                    <AvatarImage src={p.avatar_url || undefined} />
                    <AvatarFallback className="bg-secondary text-foreground">
                      {p.full_name?.charAt(0)?.toUpperCase() || 'P'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {p.full_name}
                      {p.id === partner?.id && (
                        <span className="ml-2 text-xs text-primary">(You)</span>
                      )}
                    </p>
                    <div className="flex items-center gap-2">
                      <RankBadge rank={p.rank} size="sm" showLabel={false} />
                      <span className="text-xs text-muted-foreground">
                        {p.impact_score} pts
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gradient-gold">
                      ${Number(p.total_contributions).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-muted-foreground font-medium text-sm">{position}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-semibold">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">Top contributing partners</p>
      </header>

      {/* Period Filter */}
      <div className="flex gap-2 p-1 rounded-lg bg-secondary">
        {(['weekly', 'monthly', 'all_time'] as Period[]).map((p) => (
          <Button
            key={p}
            variant={period === p ? 'default' : 'ghost'}
            size="sm"
            className={cn('flex-1 capitalize')}
            onClick={() => setPeriod(p)}
          >
            {p.replace('_', ' ')}
          </Button>
        ))}
      </div>

      {/* Current User Position */}
      {partner && leaderboard && (
        <Card className="border shadow-sm bg-secondary/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <span className="font-semibold text-primary">
                  #{leaderboard.findIndex((p) => p.id === partner.id) + 1 || '?'}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium">Your Position</p>
                <p className="text-sm text-muted-foreground">
                  ${partner.total_contributions.toLocaleString()} contributed
                </p>
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded bg-secondary capitalize">{partner.rank}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard List */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 rounded-lg bg-secondary animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard?.map((p, index) => (
                <div
                  key={p.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                    index < 3 ? 'bg-secondary/50' : 'bg-card',
                    p.id === partner?.id && 'ring-1 ring-primary'
                  )}
                >
                  <div className="flex items-center justify-center w-8">
                    {getPositionIcon(index + 1)}
                  </div>
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={p.avatar_url || undefined} />
                    <AvatarFallback className="bg-secondary text-foreground text-sm">
                      {p.full_name?.charAt(0)?.toUpperCase() || 'P'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {p.full_name}
                      {p.id === partner?.id && (
                        <span className="ml-2 text-xs text-primary">(You)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{p.rank} • {p.impact_score} pts</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
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

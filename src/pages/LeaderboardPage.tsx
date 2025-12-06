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

  // Fetch leaderboard from leaderboard_cache joined with partners
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leaderboard_cache')
        .select('*, partners(id, full_name, avatar_url, rank, impact_score)')
        .eq('period', period)
        .order('rank_position', { ascending: true })
        .limit(50);
      
      if (error) {
        console.error('Leaderboard error:', error);
        return [];
      }
      return data || [];
    },
  });

  // Find current user's position
  const userPosition = leaderboard?.findIndex((entry) => entry.partners?.id === partner?.id);
  const userEntry = userPosition !== undefined && userPosition >= 0 ? leaderboard?.[userPosition] : null;

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
      {partner && userEntry && (
        <Card className="border shadow-sm bg-secondary/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <span className="font-semibold text-primary">
                  #{userEntry.rank_position}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium">Your Position</p>
                <p className="text-sm text-muted-foreground">
                  ${Number(userEntry.total_amount).toLocaleString()} contributed
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
          ) : leaderboard && leaderboard.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                    entry.rank_position <= 3 ? 'bg-secondary/50' : 'bg-card',
                    entry.partners?.id === partner?.id && 'ring-1 ring-primary'
                  )}
                >
                  <div className="flex items-center justify-center w-8">
                    {getPositionIcon(entry.rank_position)}
                  </div>
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={entry.partners?.avatar_url || undefined} />
                    <AvatarFallback className="bg-secondary text-foreground text-sm">
                      {entry.partners?.full_name?.charAt(0)?.toUpperCase() || 'P'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {entry.partners?.full_name || 'Unknown'}
                      {entry.partners?.id === partner?.id && (
                        <span className="ml-2 text-xs text-primary">(You)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {entry.partners?.rank || 'bronze'} • {entry.partners?.impact_score || 0} pts
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ${Number(entry.total_amount).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No rankings available for this period</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import { useAuth } from '@/hooks/useAuth';
import { StatCard } from '@/components/StatCard';
import { RankBadge, RankIcon } from '@/components/RankBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Calendar, Target, ChevronRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { partner, user } = useAuth();

  // Fetch recent contributions
  const { data: contributions } = useQuery({
    queryKey: ['contributions', partner?.id],
    queryFn: async () => {
      if (!partner?.id) return [];
      const { data } = await supabase
        .from('contributions')
        .select('*')
        .eq('partner_id', partner.id)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!partner?.id,
  });

  // Fetch impact score history
  const { data: scoreHistory } = useQuery({
    queryKey: ['impact-history', partner?.id],
    queryFn: async () => {
      if (!partner?.id) return [];
      const { data } = await supabase
        .from('impact_score_history')
        .select('*')
        .eq('partner_id', partner.id)
        .order('recorded_at', { ascending: true })
        .limit(12);
      return data || [];
    },
    enabled: !!partner?.id,
  });

  const chartData = scoreHistory?.map((item) => ({
    date: format(new Date(item.recorded_at), 'MMM'),
    score: item.score,
  })) || [];

  // Check current month contribution
  const currentMonth = new Date().toISOString().slice(0, 7);
  const hasContributedThisMonth = contributions?.some(
    (c) => c.contribution_date.startsWith(currentMonth) && c.status === 'approved'
  );

  const firstName = partner?.full_name?.split(' ')[0] || 'Partner';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="text-2xl font-bold">{firstName} 👋</h1>
        </div>
        <RankIcon rank={partner?.rank || 'bronze'} />
      </header>

      {/* Rank Card */}
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <CardContent className="p-6 relative">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Current Rank</p>
              <RankBadge rank={partner?.rank || 'bronze'} size="lg" />
              <p className="text-xs text-muted-foreground mt-2">
                Keep contributing to level up!
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-gradient-gold">
                {partner?.impact_score || 0}
              </p>
              <p className="text-sm text-muted-foreground">Impact Score</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          title="Total Contributed"
          value={`$${(partner?.total_contributions || 0).toLocaleString()}`}
          icon={DollarSign}
          variant="gold"
        />
        <StatCard
          title="This Month"
          value={hasContributedThisMonth ? '✓ Done' : 'Pending'}
          subtitle={hasContributedThisMonth ? 'Great work!' : 'Submit now'}
          icon={Calendar}
        />
      </div>

      {/* Impact Score Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Impact Trend</CardTitle>
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(43 96% 56%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(43 96% 56%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: 'hsl(215 20% 55%)', fontSize: 12 }}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(222 47% 9%)',
                      border: '1px solid hsl(222 30% 18%)',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(43 96% 56%)"
                    strokeWidth={2}
                    fill="url(#scoreGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link to="/submit">
            <Button variant="gold" className="w-full justify-between" size="lg">
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Submit Contribution
              </span>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link to="/leaderboard">
            <Button variant="outline" className="w-full justify-between" size="lg">
              <span className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                View Leaderboard
              </span>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {contributions && contributions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {contributions.slice(0, 3).map((contribution) => (
                <div
                  key={contribution.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div>
                    <p className="font-medium">${Number(contribution.amount).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(contribution.contribution_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      contribution.status === 'approved'
                        ? 'bg-success/20 text-success'
                        : contribution.status === 'rejected'
                        ? 'bg-destructive/20 text-destructive'
                        : 'bg-warning/20 text-warning'
                    }`}
                  >
                    {contribution.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

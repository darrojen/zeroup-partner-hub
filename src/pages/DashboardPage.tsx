import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DollarSign, TrendingUp, TrendingDown, Calendar, ArrowRight, Check, Clock, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { partner, isAdmin } = useAuth();

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
        .limit(10);
      return data || [];
    },
    enabled: !!partner?.id,
  });

  // Fetch pending contributions for admin
  const { data: pendingContributions } = useQuery({
    queryKey: ['pending-contributions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('contributions')
        .select('*, partners(full_name, email, user_id)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: isAdmin,
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
        .limit(7);
      return data || [];
    },
    enabled: !!partner?.id,
  });

  const chartData = scoreHistory?.map((item) => ({
    date: format(new Date(item.recorded_at), 'dd'),
    score: item.score,
  })) || [];

  // Check current month contribution
  const currentMonth = new Date().toISOString().slice(0, 7);
  const hasContributedThisMonth = contributions?.some(
    (c) => c.contribution_date.startsWith(currentMonth) && c.status === 'approved'
  );

  const firstName = partner?.full_name?.split(' ')[0] || 'Partner';

  // Calculate month-over-month change
  const approvedContributions = contributions?.filter(c => c.status === 'approved') || [];
  const lastMonthTotal = approvedContributions
    .filter(c => {
      const date = new Date(c.contribution_date);
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
    })
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const thisMonthTotal = approvedContributions
    .filter(c => {
      const date = new Date(c.contribution_date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const percentChange = lastMonthTotal > 0 
    ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
    : 0;

  if (isAdmin) {
    return <AdminDashboard pendingContributions={pendingContributions || []} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Hello, {firstName}</h1>
        <p className="text-muted-foreground text-sm">Track your partnership progress here.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-secondary">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">Total Income</span>
            </div>
            <p className="text-2xl font-semibold">${(partner?.total_contributions || 0).toLocaleString()}</p>
            {percentChange !== 0 && (
              <div className={`flex items-center gap-1 text-xs mt-1 ${percentChange > 0 ? 'text-success' : 'text-destructive'}`}>
                {percentChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{percentChange > 0 ? '+' : ''}{percentChange}%</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-secondary">
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">This Month</span>
            </div>
            <p className="text-2xl font-semibold">${thisMonthTotal.toLocaleString()}</p>
            <p className={`text-xs mt-1 ${hasContributedThisMonth ? 'text-success' : 'text-warning'}`}>
              {hasContributedThisMonth ? 'Completed' : 'Pending'}
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-secondary">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">Impact</span>
            </div>
            <p className="text-2xl font-semibold">{partner?.impact_score || 0}</p>
            <p className="text-xs text-muted-foreground mt-1 capitalize">{partner?.rank || 'Bronze'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      {chartData.length > 0 && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--chart-blue))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-blue))', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">Recent Contributions</CardTitle>
          <Link to="/submit">
            <Button variant="ghost" size="sm" className="text-sm">
              Add New <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {contributions && contributions.length > 0 ? (
            <div className="space-y-3">
              {contributions.slice(0, 5).map((contribution) => (
                <div
                  key={contribution.id}
                  className="flex items-center justify-between py-3 border-b last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      contribution.status === 'approved' ? 'bg-success/10' :
                      contribution.status === 'rejected' ? 'bg-destructive/10' : 'bg-warning/10'
                    }`}>
                      {contribution.status === 'approved' ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : contribution.status === 'rejected' ? (
                        <X className="w-4 h-4 text-destructive" />
                      ) : (
                        <Clock className="w-4 h-4 text-warning" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">${Number(contribution.amount).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(contribution.contribution_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium capitalize ${
                    contribution.status === 'approved' ? 'text-success' :
                    contribution.status === 'rejected' ? 'text-destructive' : 'text-warning'
                  }`}>
                    {contribution.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No contributions yet</p>
              <Link to="/submit">
                <Button className="mt-4" size="sm">Submit Your First Contribution</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Admin Dashboard Component
function AdminDashboard({ pendingContributions }: { pendingContributions: any[] }) {
  const { toast } = useToast();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');

  const handleApprove = async (contributionId: string, partnerId: string, amount: number, partnerUserId: string) => {
    // Update contribution status
    const { error: updateError } = await supabase
      .from('contributions')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', contributionId);

    if (updateError) {
      toast({ title: 'Error', description: 'Failed to approve contribution', variant: 'destructive' });
      return;
    }

    // Update partner's total contributions
    const { data: partnerData } = await supabase
      .from('partners')
      .select('total_contributions, impact_score, user_id')
      .eq('id', partnerId)
      .single();

    if (partnerData) {
      const newTotal = Number(partnerData.total_contributions) + amount;
      const newScore = partnerData.impact_score + Math.floor(amount / 100);

      await supabase
        .from('partners')
        .update({ 
          total_contributions: newTotal,
          impact_score: newScore 
        })
        .eq('id', partnerId);

      // Notify partner about approval
      await supabase.from('notifications').insert({
        user_id: partnerData.user_id,
        type: 'approval',
        title: 'Contribution Approved',
        message: `Your contribution of $${amount.toLocaleString()} has been approved and added to your total.`,
        metadata: { contribution_id: contributionId, amount },
      });
    }

    toast({ title: 'Success', description: 'Contribution approved and total updated' });
    window.location.reload();
  };

  const handleReject = async (contributionId: string, partnerId: string, amount: number) => {
    const { data: partnerData } = await supabase
      .from('partners')
      .select('user_id')
      .eq('id', partnerId)
      .single();

    const { error } = await supabase
      .from('contributions')
      .update({ 
        status: 'rejected', 
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejectComment || 'No reason provided'
      })
      .eq('id', contributionId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to reject contribution', variant: 'destructive' });
      return;
    }

    // Notify partner about rejection
    if (partnerData) {
      await supabase.from('notifications').insert({
        user_id: partnerData.user_id,
        type: 'rejection',
        title: 'Contribution Rejected',
        message: `Your contribution of $${amount.toLocaleString()} was rejected. Reason: ${rejectComment || 'No reason provided'}`,
        metadata: { contribution_id: contributionId, amount, reason: rejectComment },
      });
    }

    setRejectingId(null);
    setRejectComment('');
    toast({ title: 'Rejected', description: 'Contribution has been rejected' });
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm">Manage partner contributions and approvals.</p>
      </header>

      {/* Pending Stats */}
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-warning/10">
              <Clock className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-3xl font-semibold">{pendingContributions.length}</p>
              <p className="text-sm text-muted-foreground">Pending Approvals</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Contributions */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium">Pending Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingContributions.length > 0 ? (
            <div className="space-y-4">
              {pendingContributions.map((contribution) => (
                <div key={contribution.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium">{contribution.partners?.full_name}</p>
                      <p className="text-sm text-muted-foreground">{contribution.partners?.email}</p>
                    </div>
                    <p className="text-xl font-semibold">${Number(contribution.amount).toLocaleString()}</p>
                  </div>
                  
                  {rejectingId === contribution.id ? (
                    <div className="space-y-3">
                      <Input
                        placeholder="Reason for rejection..."
                        value={rejectComment}
                        onChange={(e) => setRejectComment(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setRejectingId(null); setRejectComment(''); }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(contribution.id, contribution.partner_id, Number(contribution.amount))}
                        >
                          Confirm Reject
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(contribution.contribution_date), 'MMM d, yyyy')}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRejectingId(contribution.id)}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(contribution.id, contribution.partner_id, Number(contribution.amount), contribution.partners?.user_id)}
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {contribution.proof_url && (
                    <a 
                      href={contribution.proof_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mt-2 block"
                    >
                      View Proof
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Check className="w-12 h-12 mx-auto mb-2 text-success" />
              <p className="text-sm">All caught up! No pending approvals.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

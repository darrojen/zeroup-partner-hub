import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Clock, Eye, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ContributionsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProof, setSelectedProof] = useState<string | null>(null);

  const { data: contributions, isLoading } = useQuery({
    queryKey: ['all-contributions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('contributions')
        .select('*, partners(full_name, email)')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ contributionId, partnerId, amount }: { contributionId: string; partnerId: string; amount: number }) => {
      const { error: updateError } = await supabase
        .from('contributions')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', contributionId);

      if (updateError) throw updateError;

      const { data: partnerData } = await supabase
        .from('partners')
        .select('total_contributions, impact_score')
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
      }
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Contribution approved' });
      queryClient.invalidateQueries({ queryKey: ['all-contributions'] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to approve', variant: 'destructive' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (contributionId: string) => {
      const { error } = await supabase
        .from('contributions')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
        .eq('id', contributionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Rejected', description: 'Contribution rejected' });
      queryClient.invalidateQueries({ queryKey: ['all-contributions'] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to reject', variant: 'destructive' });
    },
  });

  const pendingContributions = contributions?.filter(c => c.status === 'pending') || [];
  const approvedContributions = contributions?.filter(c => c.status === 'approved') || [];
  const rejectedContributions = contributions?.filter(c => c.status === 'rejected') || [];

  const ContributionCard = ({ contribution, showActions = false }: { contribution: any; showActions?: boolean }) => (
    <div className="p-4 border border-border rounded-lg bg-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-foreground truncate">{contribution.partners?.full_name}</p>
            <Badge variant={
              contribution.status === 'approved' ? 'default' :
              contribution.status === 'rejected' ? 'destructive' : 'secondary'
            } className="text-xs capitalize">
              {contribution.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{contribution.partners?.email}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {format(new Date(contribution.contribution_date), 'MMM d, yyyy')}
          </p>
        </div>
        <p className="text-xl font-semibold text-foreground">${Number(contribution.amount).toLocaleString()}</p>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        {contribution.proof_url && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedProof(contribution.proof_url)}
            className="text-muted-foreground"
          >
            <Eye className="w-4 h-4 mr-1" />
            View Proof
          </Button>
        )}
        
        {showActions && (
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => rejectMutation.mutate(contribution.id)}
              disabled={rejectMutation.isPending}
            >
              <X className="w-4 h-4 mr-1" />
              Reject
            </Button>
            <Button
              size="sm"
              onClick={() => approveMutation.mutate({
                contributionId: contribution.id,
                partnerId: contribution.partner_id,
                amount: Number(contribution.amount)
              })}
              disabled={approveMutation.isPending}
            >
              <Check className="w-4 h-4 mr-1" />
              Approve
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Contributions</h1>
        <p className="text-muted-foreground text-sm">Review and manage partner contributions.</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-warning/10">
                <Clock className="w-4 h-4 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{pendingContributions.length}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-success/10">
                <Check className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{approvedContributions.length}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-destructive/10">
                <X className="w-4 h-4 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{rejectedContributions.length}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="pending" className="flex-1 sm:flex-none">
            Pending ({pendingContributions.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex-1 sm:flex-none">
            Approved ({approvedContributions.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex-1 sm:flex-none">
            Rejected ({rejectedContributions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-3">
          {pendingContributions.length > 0 ? (
            pendingContributions.map((c) => (
              <ContributionCard key={c.id} contribution={c} showActions />
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Check className="w-12 h-12 mx-auto mb-3 text-success" />
                <p className="text-muted-foreground">All caught up! No pending contributions.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4 space-y-3">
          {approvedContributions.length > 0 ? (
            approvedContributions.map((c) => (
              <ContributionCard key={c.id} contribution={c} />
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No approved contributions yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-4 space-y-3">
          {rejectedContributions.length > 0 ? (
            rejectedContributions.map((c) => (
              <ContributionCard key={c.id} contribution={c} />
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No rejected contributions.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Proof Dialog */}
      <Dialog open={!!selectedProof} onOpenChange={() => setSelectedProof(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Proof of Payment</DialogTitle>
          </DialogHeader>
          {selectedProof && (
            <div className="mt-4">
              <img 
                src={selectedProof} 
                alt="Proof of payment" 
                className="w-full rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

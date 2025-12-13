import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, DollarSign, Calendar, CreditCard, FileImage, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const paymentMethods = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'other', label: 'Other' },
];

export default function SubmitPage() {
  const { partner } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select a file under 10MB',
          variant: 'destructive',
        });
        return;
      }
      setProofFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!partner?.id) {
      toast({
        title: 'Error',
        description: 'Partner profile not found',
        variant: 'destructive',
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid contribution amount',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      let proofUrl = null;

      // Upload proof file if provided
      if (proofFile) {
        setUploadProgress(30);
        const fileExt = proofFile.name.split('.').pop();
        const fileName = `${partner.id}/${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('proof-uploads')
          .upload(fileName, proofFile);

        if (uploadError) throw uploadError;

        // Store the file path - access will be controlled by RLS policies
        // Admins and owners can view via signed URLs when needed
        proofUrl = fileName;
        setUploadProgress(70);
      }

      // Create contribution record
      const { data: contributionData, error: insertError } = await supabase.from('contributions').insert({
        partner_id: partner.id,
        amount: parseFloat(amount),
        contribution_date: date,
        payment_method: paymentMethod || null,
        proof_url: proofUrl,
        notes: notes || null,
        status: 'pending',
      }).select().single();

      if (insertError) throw insertError;

      // Notify all admins about the new contribution
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'super_admin']);

      if (admins && admins.length > 0) {
        const notifications = admins.map((admin) => ({
          user_id: admin.user_id,
          type: 'contribution',
          title: 'New Contribution Submitted',
          message: `${partner.full_name} submitted a contribution of $${parseFloat(amount).toLocaleString()} for approval.`,
          metadata: { contribution_id: contributionData.id, partner_id: partner.id, amount: parseFloat(amount) },
        }));

        await supabase.from('notifications').insert(notifications);
      }

      setUploadProgress(100);
      setIsSuccess(true);

      toast({
        title: 'Submission received!',
        description: 'Your contribution is pending admin approval.',
      });

      // Reset form after delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      toast({
        title: 'Submission failed',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-success/10">
          <CheckCircle className="w-10 h-10 text-success" />
        </div>
        <h2 className="mt-6 text-2xl font-semibold">Submission Received!</h2>
        <p className="mt-2 text-center text-muted-foreground">
          Your contribution of <span className="font-semibold">${parseFloat(amount).toLocaleString()}</span> is pending approval.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-semibold">Submit Contribution</h1>
        <p className="text-sm text-muted-foreground">Record your partnership payment</p>
      </header>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium">Contribution Details</CardTitle>
          <CardDescription>Fill in the details of your contribution</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Amount (USD)
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg font-medium"
                min="1"
                step="0.01"
                required
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Payment Date
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
                required
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Payment Method
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Proof Upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileImage className="w-4 h-4" />
                Proof of Payment
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed cursor-pointer transition-colors',
                  proofFile
                    ? 'border-success bg-success/5'
                    : 'border-border hover:border-muted-foreground/50 hover:bg-secondary/50'
                )}
              >
                {proofFile ? (
                  <>
                    <CheckCircle className="w-8 h-8 text-success" />
                    <p className="text-sm font-medium">{proofFile.name}</p>
                    <p className="text-xs text-muted-foreground">Click to change</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload screenshot or PDF
                    </p>
                    <p className="text-xs text-muted-foreground">Max 10MB</p>
                  </>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Progress Bar */}
            {isSubmitting && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  {uploadProgress < 100 ? 'Uploading...' : 'Completing...'}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Submit Contribution
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

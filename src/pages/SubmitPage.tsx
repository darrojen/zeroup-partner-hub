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
import { Upload, DollarSign, Calendar, CreditCard, FileImage, Loader2, CheckCircle, Sparkles } from 'lucide-react';
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

        const { data: urlData } = supabase.storage
          .from('proof-uploads')
          .getPublicUrl(fileName);

        proofUrl = urlData.publicUrl;
        setUploadProgress(70);
      }

      // Create contribution record
      const { error: insertError } = await supabase.from('contributions').insert({
        partner_id: partner.id,
        amount: parseFloat(amount),
        contribution_date: date,
        payment_method: paymentMethod || null,
        proof_url: proofUrl,
        notes: notes || null,
        status: 'pending',
      });

      if (insertError) throw insertError;

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-scale-in">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary to-amber-500 shadow-gold">
            <CheckCircle className="w-12 h-12 text-primary-foreground" />
          </div>
        </div>
        <h2 className="mt-6 text-2xl font-bold">Submission Received!</h2>
        <p className="mt-2 text-center text-muted-foreground">
          Your contribution of <span className="text-primary font-semibold">${parseFloat(amount).toLocaleString()}</span> is pending approval.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <header className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-amber-500 shadow-gold mb-3">
          <Sparkles className="w-7 h-7 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Submit Contribution</h1>
        <p className="text-sm text-muted-foreground">Record your partnership payment</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contribution Details</CardTitle>
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
                className="text-lg font-semibold"
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
                  'flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200',
                  proofFile
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                )}
              >
                {proofFile ? (
                  <>
                    <CheckCircle className="w-8 h-8 text-primary" />
                    <p className="text-sm font-medium text-primary">{proofFile.name}</p>
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
                    className="h-full bg-gradient-to-r from-primary to-amber-500 transition-all duration-300"
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
              variant="gold"
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

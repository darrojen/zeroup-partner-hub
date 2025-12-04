-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'super_admin');

-- Create rank enum
CREATE TYPE public.partner_rank AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'black_card');

-- Create contribution status enum
CREATE TYPE public.contribution_status AS ENUM ('pending', 'approved', 'rejected');

-- Partners table (profile for authenticated users)
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  rank partner_rank DEFAULT 'bronze' NOT NULL,
  total_contributions DECIMAL(12,2) DEFAULT 0 NOT NULL,
  impact_score INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Admin roles table (separate from partners for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Ranks configuration table
CREATE TABLE public.ranks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rank_name partner_rank NOT NULL UNIQUE,
  min_score INTEGER NOT NULL,
  badge_url TEXT,
  description TEXT,
  perks TEXT[],
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Insert default ranks
INSERT INTO public.ranks (rank_name, min_score, description, perks) VALUES
  ('bronze', 0, 'Starting partner level', ARRAY['Basic partner access', 'Monthly newsletter']),
  ('silver', 1000, 'Growing partner level', ARRAY['Bronze benefits', 'Quarterly reports', 'Partner events access']),
  ('gold', 5000, 'Established partner level', ARRAY['Silver benefits', 'Priority support', 'Exclusive webinars']),
  ('platinum', 15000, 'Premium partner level', ARRAY['Gold benefits', 'Personal account manager', 'VIP events']),
  ('black_card', 50000, 'Elite partner level', ARRAY['Platinum benefits', 'Board meeting access', 'Executive networking']);

-- Contributions table
CREATE TABLE public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  proof_url TEXT,
  status contribution_status DEFAULT 'pending' NOT NULL,
  notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Impact score history for graphs
CREATE TABLE public.impact_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Leaderboard cache (materialized for performance)
CREATE TABLE public.leaderboard_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  period TEXT NOT NULL, -- 'weekly', 'monthly', 'all_time'
  total_amount DECIMAL(12,2) NOT NULL,
  rank_position INTEGER NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (partner_id, period)
);

-- Recognitions table
CREATE TABLE public.recognitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  recognition_type TEXT NOT NULL, -- 'partner_of_month', 'milestone', 'appreciation'
  title TEXT NOT NULL,
  description TEXT,
  month DATE,
  badge_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'approval', 'reminder', 'rank_upgrade', 'recognition'
  is_read BOOLEAN DEFAULT false NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is any admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

-- RLS Policies

-- Partners: users can read their own, admins can read all
CREATE POLICY "Partners can view own profile"
  ON public.partners FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all partners"
  ON public.partners FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Partners can update own profile"
  ON public.partners FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Partners can insert own profile"
  ON public.partners FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User roles: only super admins can manage
CREATE POLICY "Super admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Ranks: everyone can read
CREATE POLICY "Anyone can view ranks"
  ON public.ranks FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage ranks"
  ON public.ranks FOR ALL
  USING (public.is_admin(auth.uid()));

-- Contributions: partners see own, admins see all
CREATE POLICY "Partners can view own contributions"
  ON public.contributions FOR SELECT
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all contributions"
  ON public.contributions FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Partners can insert contributions"
  ON public.contributions FOR INSERT
  WITH CHECK (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));

CREATE POLICY "Admins can update contributions"
  ON public.contributions FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Impact score history
CREATE POLICY "Partners can view own history"
  ON public.impact_score_history FOR SELECT
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all history"
  ON public.impact_score_history FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Leaderboard: everyone can read
CREATE POLICY "Anyone can view leaderboard"
  ON public.leaderboard_cache FOR SELECT
  USING (true);

CREATE POLICY "System can update leaderboard"
  ON public.leaderboard_cache FOR ALL
  USING (public.is_admin(auth.uid()));

-- Recognitions: everyone can read featured
CREATE POLICY "Anyone can view recognitions"
  ON public.recognitions FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage recognitions"
  ON public.recognitions FOR ALL
  USING (public.is_admin(auth.uid()));

-- Notifications: users see own
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Audit logs: admins only
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contributions_updated_at
  BEFORE UPDATE ON public.contributions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create partner profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.partners (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for proof uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('proof-uploads', 'proof-uploads', true);

-- Storage policies
CREATE POLICY "Users can upload proof files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'proof-uploads' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view proof files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'proof-uploads');

CREATE POLICY "Users can update own proof files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'proof-uploads' AND auth.role() = 'authenticated');

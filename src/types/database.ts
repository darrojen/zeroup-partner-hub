export type PartnerRank = 'bronze' | 'silver' | 'gold' | 'platinum' | 'black_card';
export type ContributionStatus = 'pending' | 'approved' | 'rejected';
export type AppRole = 'admin' | 'super_admin';

export interface Partner {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  rank: PartnerRank;
  total_contributions: number;
  impact_score: number;
  created_at: string;
  updated_at: string;
}

export interface Contribution {
  id: string;
  partner_id: string;
  amount: number;
  contribution_date: string;
  payment_method?: string;
  proof_url?: string;
  status: ContributionStatus;
  notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  partner?: Partner;
}

export interface Rank {
  id: string;
  rank_name: PartnerRank;
  min_score: number;
  badge_url?: string;
  description?: string;
  perks?: string[];
  created_at: string;
}

export interface Recognition {
  id: string;
  partner_id: string;
  recognition_type: string;
  title: string;
  description?: string;
  month?: string;
  badge_url?: string;
  is_featured: boolean;
  created_at: string;
  partner?: Partner;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  partner_id: string;
  period: string;
  total_amount: number;
  rank_position: number;
  updated_at: string;
  partner?: Partner;
}

export interface ImpactScoreHistory {
  id: string;
  partner_id: string;
  score: number;
  recorded_at: string;
}

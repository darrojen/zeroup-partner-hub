import { PartnerRank } from '@/types/database';
import { cn } from '@/lib/utils';
import { Crown, Star, Award, Medal, Shield } from 'lucide-react';

interface RankBadgeProps {
  rank: PartnerRank;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const rankConfig: Record<PartnerRank, {
  label: string;
  icon: typeof Crown;
  gradient: string;
  textColor: string;
}> = {
  bronze: {
    label: 'Bronze',
    icon: Shield,
    gradient: 'from-amber-700 to-amber-900',
    textColor: 'text-amber-200',
  },
  silver: {
    label: 'Silver',
    icon: Medal,
    gradient: 'from-slate-300 to-slate-500',
    textColor: 'text-slate-100',
  },
  gold: {
    label: 'Gold',
    icon: Award,
    gradient: 'from-yellow-400 to-amber-500',
    textColor: 'text-yellow-100',
  },
  platinum: {
    label: 'Platinum',
    icon: Star,
    gradient: 'from-cyan-300 to-blue-500',
    textColor: 'text-cyan-100',
  },
  black_card: {
    label: 'Black Card',
    icon: Crown,
    gradient: 'from-slate-900 to-slate-700',
    textColor: 'text-primary',
  },
};

const sizeConfig = {
  sm: { container: 'h-6 px-2 text-xs', icon: 'w-3 h-3' },
  md: { container: 'h-8 px-3 text-sm', icon: 'w-4 h-4' },
  lg: { container: 'h-10 px-4 text-base', icon: 'w-5 h-5' },
};

export function RankBadge({ rank, size = 'md', showLabel = true }: RankBadgeProps) {
  const config = rankConfig[rank];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r font-semibold shadow-lg',
        config.gradient,
        config.textColor,
        sizes.container
      )}
    >
      <Icon className={sizes.icon} />
      {showLabel && <span>{config.label}</span>}
    </div>
  );
}

export function RankIcon({ rank, className }: { rank: PartnerRank; className?: string }) {
  const config = rankConfig[rank];
  const Icon = config.icon;
  
  return (
    <div className={cn('relative', className)}>
      <div className={cn(
        'absolute inset-0 rounded-full bg-gradient-to-r opacity-20 blur-xl',
        config.gradient
      )} />
      <div className={cn(
        'relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r shadow-lg',
        config.gradient
      )}>
        <Icon className={cn('w-8 h-8', config.textColor)} />
      </div>
    </div>
  );
}

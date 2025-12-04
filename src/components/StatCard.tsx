import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'gold' | 'gradient';
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300',
        variant === 'gold' && 'border-primary/30 bg-gradient-to-br from-primary/10 to-card',
        variant === 'gradient' && 'bg-gradient-to-b from-card to-background border-border/50',
        className
      )}
    >
      {variant === 'gold' && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
      )}
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={cn(
              'text-3xl font-bold tracking-tight animate-count-up',
              variant === 'gold' && 'text-gradient-gold'
            )}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <p className={cn(
                'text-xs font-medium',
                trend.isPositive ? 'text-success' : 'text-destructive'
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}% from last month
              </p>
            )}
          </div>
          <div className={cn(
            'p-3 rounded-xl transition-colors duration-300',
            variant === 'gold' 
              ? 'bg-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
              : 'bg-secondary text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'
          )}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

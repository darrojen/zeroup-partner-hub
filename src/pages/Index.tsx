import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Shield, Trophy, TrendingUp, Users } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Secure Contributions',
    description: 'Track and submit partnership contributions with proof uploads',
  },
  {
    icon: Trophy,
    title: 'Rank System',
    description: 'Level up from Bronze to Black Card based on your impact score',
  },
  {
    icon: TrendingUp,
    title: 'Impact Analytics',
    description: 'Visualize your contribution trends and growth over time',
  },
  {
    icon: Users,
    title: 'Leaderboards',
    description: 'Compete with other partners and climb the rankings',
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 container max-w-lg mx-auto px-4 py-12 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-gold">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">ZeroUp</span>
          </div>
          <Link to="/auth">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </Link>
        </header>

        {/* Hero */}
        <main className="flex-1 flex flex-col justify-center">
          <div className="text-center space-y-6 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-primary font-medium">Partner Engagement Platform</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              Grow Your{' '}
              <span className="text-gradient-gold">Impact</span>
              <br />
              Together
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Track contributions, earn recognition, and climb the ranks in our exclusive partner community.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/auth">
                <Button variant="gold" size="xl" className="w-full sm:w-auto">
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="xl" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="p-4 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center pt-12">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ZeroUp Next Partners. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}

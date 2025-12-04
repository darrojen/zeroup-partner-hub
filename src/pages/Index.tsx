import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Trophy, TrendingUp, Users } from 'lucide-react';

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
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-12 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">Z</span>
            </div>
            <span className="text-xl font-semibold">ZeroUp</span>
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-sm">
              <span className="font-medium">Partner Engagement Platform</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-foreground">
              Grow Your Impact Together
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Track contributions, earn recognition, and climb the ranks in our exclusive partner community.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-4 rounded-xl bg-card border"
              >
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3">
                  <feature.icon className="w-5 h-5 text-muted-foreground" />
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

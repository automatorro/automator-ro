import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BookOpen, Users, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Hero = () => {
  const { t } = useTranslation('homepage');
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20" />
      
      {/* Animated circles */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <div className="container relative z-10 mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight animate-fade-in">
            <span className="bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
              {t('hero.title')}
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto animate-fade-in delay-100">
            {t('hero.subtitle')}
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in delay-200">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-xl hover:shadow-2xl transition-all hover:scale-105"
              onClick={() => navigate('/auth')}
            >
              {t('hero.ctaPrimary')}
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 backdrop-blur-sm bg-background/50 hover:bg-background/80 border-2 transition-all hover:scale-105"
            >
              {t('hero.ctaSecondary')}
            </Button>
          </div>
          
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 animate-fade-in delay-300">
            <Card className="p-6 backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold">{t('hero.stats.courses').split(' ')[0]}</p>
                  <p className="text-sm text-muted-foreground">{t('hero.stats.courses').split(' ').slice(1).join(' ')}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-secondary/10">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold">{t('hero.stats.satisfaction').split(' ')[0]}</p>
                  <p className="text-sm text-muted-foreground">{t('hero.stats.satisfaction').split(' ').slice(1).join(' ')}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-accent/10">
                  <Clock className="h-6 w-6 text-accent" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold">{t('hero.stats.availability')}</p>
                  <p className="text-sm text-muted-foreground">disponibil</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

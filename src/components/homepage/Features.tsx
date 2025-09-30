import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Palette, Zap, Edit3, LayoutDashboard, Shield } from 'lucide-react';

export const Features = () => {
  const { t } = useTranslation('homepage');

  const features = [
    {
      icon: Sparkles,
      title: t('features.ai.title'),
      description: t('features.ai.description'),
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Palette,
      title: t('features.customize.title'),
      description: t('features.customize.description'),
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Zap,
      title: t('features.fast.title'),
      description: t('features.fast.description'),
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      icon: Edit3,
      title: t('features.editor.title'),
      description: t('features.editor.description'),
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: LayoutDashboard,
      title: t('features.dashboard.title'),
      description: t('features.dashboard.description'),
      gradient: 'from-indigo-500 to-purple-500',
    },
    {
      icon: Shield,
      title: t('features.security.title'),
      description: t('features.security.description'),
      gradient: 'from-red-500 to-pink-500',
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-background via-primary/5 to-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            {t('features.title')}
          </h2>
          <p className="text-xl text-muted-foreground">
            {t('features.subtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="group backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <CardContent className="p-8 space-y-4">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold">
                    {feature.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

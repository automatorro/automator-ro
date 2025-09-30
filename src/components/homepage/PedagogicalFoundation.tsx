import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Target, TrendingUp, BookCheck, Award } from 'lucide-react';

export const PedagogicalFoundation = () => {
  const { t } = useTranslation('homepage');

  const foundations = [
    {
      icon: TrendingUp,
      title: t('pedagogical.bloom.title'),
      description: t('pedagogical.bloom.description'),
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Target,
      title: t('pedagogical.merrill.title'),
      description: t('pedagogical.merrill.description'),
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: BookCheck,
      title: t('pedagogical.curriculum.title'),
      description: t('pedagogical.curriculum.description'),
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Award,
      title: t('pedagogical.experience.title'),
      description: t('pedagogical.experience.description'),
      color: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/5 to-background" />
      
      <div className="container relative z-10 mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            {t('pedagogical.title')}
          </h2>
          <p className="text-xl text-muted-foreground">
            {t('pedagogical.subtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {foundations.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card 
                key={index}
                className="group relative overflow-hidden backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                <CardContent className="p-6 space-y-4 relative z-10">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${item.color} shadow-lg`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold">
                    {item.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {item.description}
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

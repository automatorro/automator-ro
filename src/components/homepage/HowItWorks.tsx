import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Sparkles, Download } from 'lucide-react';

export const HowItWorks = () => {
  const { t } = useTranslation('homepage');

  const steps = [
    {
      icon: FileText,
      title: t('howItWorks.step1.title'),
      description: t('howItWorks.step1.description'),
      number: '01',
    },
    {
      icon: Sparkles,
      title: t('howItWorks.step2.title'),
      description: t('howItWorks.step2.description'),
      number: '02',
    },
    {
      icon: Download,
      title: t('howItWorks.step3.title'),
      description: t('howItWorks.step3.description'),
      number: '03',
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            {t('howItWorks.title')}
          </h2>
          <p className="text-xl text-muted-foreground">
            {t('howItWorks.subtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                {/* Connection line for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-20 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent -translate-x-1/2" />
                )}
                
                <Card className="relative backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  <CardContent className="p-8 space-y-4">
                    {/* Step number */}
                    <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {step.number}
                    </div>
                    
                    {/* Icon */}
                    <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10">
                      <Icon className="h-10 w-10 text-primary" />
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-2xl font-bold">
                      {step.title}
                    </h3>
                    
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Pricing = () => {
  const { t } = useTranslation('homepage');
  const navigate = useNavigate();

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-background" />
      
      <div className="container relative z-10 mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            {t('pricing.title')}
          </h2>
          <p className="text-xl text-muted-foreground">
            {t('pricing.subtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Trial Card */}
          <Card className="relative backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl">{t('pricing.free.title')}</CardTitle>
              <CardDescription className="text-lg">{t('pricing.free.description')}</CardDescription>
              <div className="mt-4">
                <span className="text-5xl font-bold">{t('pricing.free.price')}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <span>{t('pricing.free.feature1')}</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <span>{t('pricing.free.feature2')}</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <span>{t('pricing.free.feature3')}</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <span>{t('pricing.free.feature4')}</span>
                </li>
              </ul>
              
              <Button 
                className="w-full text-lg py-6" 
                size="lg"
                onClick={() => navigate('/auth')}
              >
                {t('pricing.free.cta')}
              </Button>
            </CardContent>
          </Card>
          
          {/* Pro Card */}
          <Card className="relative backdrop-blur-lg bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/30 hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold">
              Popular
            </div>
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl">{t('pricing.pro.title')}</CardTitle>
              <CardDescription className="text-lg">{t('pricing.pro.description')}</CardDescription>
              <div className="mt-4">
                <span className="text-5xl font-bold">{t('pricing.pro.price')}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <span>{t('pricing.pro.feature1')}</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <span>{t('pricing.pro.feature2')}</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <span>{t('pricing.pro.feature3')}</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <span>{t('pricing.pro.feature4')}</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <span>{t('pricing.pro.feature5')}</span>
                </li>
              </ul>
              
              <Button 
                className="w-full text-lg py-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90" 
                size="lg"
              >
                {t('pricing.pro.cta')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar, 
  Target, 
  Presentation, 
  FileText, 
  Puzzle, 
  BookOpen, 
  ClipboardCheck, 
  Library 
} from 'lucide-react';

export const WhatYouGet = () => {
  const { t } = useTranslation('homepage');

  const materials = [
    {
      icon: Calendar,
      title: t('whatYouGet.agenda.title'),
      description: t('whatYouGet.agenda.description'),
    },
    {
      icon: Target,
      title: t('whatYouGet.objectives.title'),
      description: t('whatYouGet.objectives.description'),
    },
    {
      icon: Presentation,
      title: t('whatYouGet.slides.title'),
      description: t('whatYouGet.slides.description'),
    },
    {
      icon: FileText,
      title: t('whatYouGet.trainerNotes.title'),
      description: t('whatYouGet.trainerNotes.description'),
    },
    {
      icon: Puzzle,
      title: t('whatYouGet.exercises.title'),
      description: t('whatYouGet.exercises.description'),
    },
    {
      icon: BookOpen,
      title: t('whatYouGet.manual.title'),
      description: t('whatYouGet.manual.description'),
    },
    {
      icon: ClipboardCheck,
      title: t('whatYouGet.assessments.title'),
      description: t('whatYouGet.assessments.description'),
    },
    {
      icon: Library,
      title: t('whatYouGet.resources.title'),
      description: t('whatYouGet.resources.description'),
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/5 via-background to-background" />
      
      <div className="container relative z-10 mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            {t('whatYouGet.title')}
          </h2>
          <p className="text-xl text-muted-foreground">
            {t('whatYouGet.subtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {materials.map((material, index) => {
            const Icon = material.icon;
            return (
              <Card 
                key={index}
                className="group backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1"
              >
                <CardContent className="p-6 space-y-3">
                  <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  
                  <h3 className="text-lg font-bold">
                    {material.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {material.description}
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

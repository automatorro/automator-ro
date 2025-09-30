import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface CourseFormData {
  title: string;
  description: string;
  subject: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  environment: 'academic' | 'corporate';
  tone: 'formal' | 'casual' | 'professional' | 'friendly';
  language: 'en' | 'ro';
}

export function CourseBuilder({ onCourseCreated }: { onCourseCreated: (courseId: string) => void }) {
  const { t } = useTranslation('courseBuilder');
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    subject: '',
    duration: '',
    level: 'beginner',
    environment: 'corporate',
    tone: 'professional',
    language: 'en',
  });

  const handleInputChange = (field: keyof CourseFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
          user_id: user.id,
          ...formData,
          status: 'draft'
        })
        .select()
        .single();

      if (courseError) throw courseError;

      const { error: pipelineError } = await supabase
        .from('generation_pipelines')
        .insert({
          course_id: course.id,
          status: 'pending',
          current_step: 1,
          total_steps: 8,
          progress_percent: 0
        });

      if (pipelineError) throw pipelineError;

      const steps = [
        { type: 'agenda', order: 1, title: 'Course Agenda' },
        { type: 'objectives', order: 2, title: 'Learning Objectives' },
        { type: 'slides', order: 3, title: 'Presentation Slides' },
        { type: 'trainer_notes', order: 4, title: 'Trainer Notes' },
        { type: 'exercises', order: 5, title: 'Practical Exercises' },
        { type: 'manual', order: 6, title: 'Participant Manual' },
        { type: 'tests', order: 7, title: 'Tests & Quizzes' },
        { type: 'resources', order: 8, title: 'Additional Resources' },
      ];

      const { error: materialsError } = await supabase
        .from('course_materials')
        .insert(
          steps.map(step => ({
            course_id: course.id,
            material_type: step.type,
            step_order: step.order,
            title: step.title,
            status: 'pending'
          }))
        );

      if (materialsError) throw materialsError;

      toast({
        title: t('success.title'),
        description: t('success.description'),
      });

      onCourseCreated(course.id);

      setFormData({
        title: '',
        description: '',
        subject: '',
        duration: '',
        level: 'beginner',
        environment: 'corporate',
        tone: 'professional',
        language: 'en',
      });

    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: t('error.title'),
        description: t('error.description'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 border-white/20 shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          {t('title')}
        </CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('form.courseTitle.label')}</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder={t('form.courseTitle.placeholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">{t('form.subject.label')}</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder={t('form.subject.placeholder')}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('form.objectives.label')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder={t('form.objectives.placeholder')}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">{t('form.duration.label')}</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                placeholder={t('form.duration.placeholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">{t('form.level.label')}</Label>
              <Select value={formData.level} onValueChange={(value: any) => handleInputChange('level', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">{t('form.level.beginner')}</SelectItem>
                  <SelectItem value="intermediate">{t('form.level.intermediate')}</SelectItem>
                  <SelectItem value="advanced">{t('form.level.advanced')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tone">{t('form.tone.label')}</Label>
              <Select value={formData.tone} onValueChange={(value: any) => handleInputChange('tone', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">{t('form.tone.formal')}</SelectItem>
                  <SelectItem value="formal">{t('form.tone.formal')}</SelectItem>
                  <SelectItem value="friendly">{t('form.tone.informal')}</SelectItem>
                  <SelectItem value="casual">{t('form.tone.informal')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">{t('form.language.label')}</Label>
              <Select value={formData.language} onValueChange={(value: any) => handleInputChange('language', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t('form.language.english')}</SelectItem>
                  <SelectItem value="ro">{t('form.language.romanian')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-2xl transition-all hover:scale-105"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('generating')}
              </>
            ) : (
              t('generate')
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

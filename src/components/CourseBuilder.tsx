import { useState, useEffect } from 'react';
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
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  environment: 'academic' | 'corporate';
  participantType: string;
  tone: 'professional' | 'friendly';
  language: 'en' | 'ro';
}

export function CourseBuilder({ onCourseCreated, courseId }: { onCourseCreated: (courseId: string) => void; courseId?: string }) {
  const { t } = useTranslation('courseBuilder');
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    duration: '',
    level: 'beginner',
    environment: 'corporate',
    participantType: 'specialists',
    tone: 'professional',
    language: 'en',
  });
  const isEdit = !!courseId;
  const [loadingCourse, setLoadingCourse] = useState(false);

  const handleInputChange = (field: keyof CourseFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const loadCourse = async () => {
      if (!isEdit || !courseId || !user) return;
      setLoadingCourse(true);
      try {
        const { data: course, error } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        if (error) throw error;

        setFormData({
          title: course?.title || '',
          duration: course?.duration || '',
          level: (course?.level as CourseFormData['level']) || 'beginner',
          environment: (course?.environment as CourseFormData['environment']) || 'corporate',
          participantType: course?.participant_type || 'specialists',
          tone: (course?.tone as CourseFormData['tone']) || 'professional',
          language: (course?.language as CourseFormData['language']) || 'en',
        });
      } catch (err) {
        console.error('Error loading course:', err);
        toast({
          title: 'Eroare',
          description: 'Cursul nu a putut fi încărcat.',
          variant: 'destructive',
        });
      } finally {
        setLoadingCourse(false);
      }
    };

    loadCourse();
  }, [isEdit, courseId, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      if (isEdit && courseId) {
        const { data: updatedCourse, error: updateError } = await supabase
          .from('courses')
          .update({
            title: formData.title,
            subject: formData.title,
            duration: formData.duration,
            level: formData.level,
            environment: formData.environment,
            participant_type: formData.participantType,
            tone: formData.tone,
            language: formData.language,
          })
          .eq('id', courseId)
          .select()
          .single();

        if (updateError) throw updateError;

        toast({
          title: 'Curs actualizat',
          description: 'Datele cursului au fost salvate.',
        });

        onCourseCreated(updatedCourse.id);
        return;
      }
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
          user_id: user.id,
          title: formData.title,
          subject: formData.title, // Set subject same as title for DB compatibility
          description: '', // Will be generated as objectives
          duration: formData.duration,
          level: formData.level,
          environment: formData.environment,
          participant_type: formData.participantType,
          tone: formData.tone,
          language: formData.language,
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
        { type: 'objectives', order: 1, title: 'Learning Objectives' },
        { type: 'agenda', order: 2, title: 'Course Agenda' },
        { type: 'slides', order: 3, title: 'Presentation Slides' },
        { type: 'trainer_notes', order: 4, title: 'Trainer Notes' },
        { type: 'exercises', order: 5, title: 'Practical Exercises' },
        { type: 'manual', order: 6, title: 'Participant Manual' },
        { type: 'assessment', order: 7, title: 'Assessment' },
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
        duration: '',
        level: 'beginner',
        environment: 'corporate',
        participantType: 'specialists',
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
          {isEdit ? 'Editează cursul' : t('title')}
        </CardTitle>
        <CardDescription>{isEdit ? 'Modifică detaliile cursului și salvează.' : t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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
              <Label htmlFor="environment">{t('form.environment.label')}</Label>
              <Select value={formData.environment} onValueChange={(value: any) => {
                handleInputChange('environment', value);
                // Reset participant type when environment changes
                const defaultParticipant = value === 'corporate' ? 'specialists' : 'students';
                handleInputChange('participantType', defaultParticipant);
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic">{t('form.environment.academic')}</SelectItem>
                  <SelectItem value="corporate">{t('form.environment.corporate')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="participants">{t('form.participants.label')}</Label>
              <Select value={formData.participantType} onValueChange={(value: any) => handleInputChange('participantType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formData.environment === 'corporate' ? (
                    <>
                      <SelectItem value="specialists">{t('form.participants.specialists')}</SelectItem>
                      <SelectItem value="middleManagement">{t('form.participants.middleManagement')}</SelectItem>
                      <SelectItem value="topManagement">{t('form.participants.topManagement')}</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="pupils">{t('form.participants.pupils')}</SelectItem>
                      <SelectItem value="students">{t('form.participants.students')}</SelectItem>
                      <SelectItem value="teachers">{t('form.participants.teachers')}</SelectItem>
                    </>
                  )}
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
                  <SelectItem value="professional">{t('form.tone.professional')}</SelectItem>
                  <SelectItem value="friendly">{t('form.tone.friendly')}</SelectItem>
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
            disabled={loading || loadingCourse}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEdit ? 'Se salvează...' : t('generating')}
              </>
            ) : (
              isEdit ? 'Salvează modificările' : t('generate')
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

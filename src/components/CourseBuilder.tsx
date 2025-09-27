import { useState } from 'react';
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
      // Create course
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

      // Create generation pipeline
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

      // Initialize course materials with pending status
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
        title: "Course Created Successfully",
        description: "Your course is ready for generation!",
      });

      onCourseCreated(course.id);

      // Reset form
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
        title: "Error",
        description: "Failed to create course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Create New Course
        </CardTitle>
        <CardDescription>
          Fill in the details below to generate comprehensive course materials with AI
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Course Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Leadership Skills Training"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="e.g., Management, IT, Marketing"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of the course objectives and target audience"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                placeholder="e.g., 2 days, 4 hours"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Select value={formData.level} onValueChange={(value: any) => handleInputChange('level', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="environment">Environment</Label>
              <Select value={formData.environment} onValueChange={(value: any) => handleInputChange('environment', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <Select value={formData.tone} onValueChange={(value: any) => handleInputChange('tone', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select value={formData.language} onValueChange={(value: any) => handleInputChange('language', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ro">Romanian</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Course...
              </>
            ) : (
              'Create Course'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
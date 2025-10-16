import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Clock, Globe, Settings, Play, Eye, RefreshCw, Pencil, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface Course {
  id: string;
  title: string;
  subject: string;
  duration: string;
  level: string;
  environment: string;
  participant_type: string;
  language: string;
  status: string;
  created_at: string;
}

interface Pipeline {
  id: string;
  course_id: string;
  current_step: number;
  total_steps: number;
  progress_percent: number;
  status: string;
}

export function Dashboard({ onSelectCourse }: { onSelectCourse: (courseId: string) => void }) {
  const { t } = useTranslation('dashboard');
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;

      const { data: pipelinesData, error: pipelinesError } = await supabase
        .from('generation_pipelines')
        .select('*')
        .in('course_id', coursesData?.map(c => c.id) || []);

      if (pipelinesError) throw pipelinesError;

      setCourses(coursesData || []);
      setPipelines(pipelinesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startGeneration = async (courseId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-course-materials', {
        body: { courseId, continueGeneration: true }
      });

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error starting generation:', error);
    }
  };

  const deleteCourse = async (courseId: string) => {
    const confirmDelete = window.confirm('Sigur vrei să ștergi acest curs?');
    if (!confirmDelete) return;
    try {
      setDeletingId(courseId);
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);
      if (error) throw error;
      setCourses(prev => prev.filter(c => c.id !== courseId));
      setPipelines(prev => prev.filter(p => p.course_id !== courseId));
    } catch (error) {
      console.error('Error deleting course:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' } = {
      draft: 'secondary',
      generating: 'default',
      completed: 'default',
      failed: 'destructive'
    };

    const colors: { [key: string]: string } = {
      draft: 'bg-muted text-muted-foreground',
      generating: 'bg-primary/20 text-primary animate-pulse',
      completed: 'bg-success/20 text-success',
      failed: 'bg-destructive/20 text-destructive'
    };

    return (
      <Badge variant={variants[status] || 'default'} className={colors[status]}>
        {t(`status.${status}`)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('myCourses')}</h2>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="h-4 w-4" />
          {courses.length} {t('recentCourses').toLowerCase()}
        </div>
      </div>

      {courses.length === 0 ? (
        <Card className="text-center py-12 backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 border-white/20">
          <CardContent>
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle className="mb-2">{t('noCourses')}</CardTitle>
            <CardDescription>{t('noCoursesDescription')}</CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const pipeline = pipelines.find(p => p.course_id === course.id);
            return (
              <Card 
                key={course.id} 
                className="hover:shadow-2xl transition-all duration-300 hover:scale-105 backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 border-white/20"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg leading-tight">{course.title}</CardTitle>
                      <CardDescription className="flex items-center gap-1 text-sm">
                        <BookOpen className="h-3 w-3" />
                        {course.environment} • {course.participant_type}
                      </CardDescription>
                    </div>
                    {getStatusBadge(course.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {course.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <Settings className="h-3 w-3" />
                      {course.level}
                    </div>
                  </div>

                  {pipeline && pipeline.status !== 'pending' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{pipeline.progress_percent}%</span>
                      </div>
                      <Progress value={pipeline.progress_percent} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        Step {pipeline.current_step} of {pipeline.total_steps}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {course.status === 'draft' && !pipeline && (
                      <Button
                        size="sm"
                        onClick={() => startGeneration(course.id)}
                        className="flex-1"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        {t('startGeneration')}
                      </Button>
                    )}
                    {pipeline && (pipeline.status === 'failed' || (course.status === 'draft' && pipeline.status === 'running')) && (
                      <Button
                        size="sm"
                        onClick={() => startGeneration(course.id)}
                        className="flex-1"
                        variant="outline"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        {t('resume')}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant={course.status === 'completed' ? 'default' : 'outline'}
                      onClick={() => onSelectCourse(course.id)}
                      className={course.status === 'draft' && !pipeline ? '' : 'flex-1'}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      {t('viewCourse')}
                    </Button>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/dashboard/courses/${course.id}/edit`)}
                      className="flex-1"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Editează
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteCourse(course.id)}
                      disabled={deletingId === course.id}
                      className="flex-1"
                    >
                      <Trash className="h-3 w-3 mr-1" />
                      {deletingId === course.id ? 'Ștergere...' : 'Șterge'}
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground border-t pt-3">
                    {t('courseCreated')} {format(new Date(course.created_at), 'MMM d, yyyy')}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

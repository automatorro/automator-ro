import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Clock, Globe, Settings, Play, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface Course {
  id: string;
  title: string;
  subject: string;
  duration: string;
  level: string;
  environment: string;
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
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Load courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;

      // Load pipelines
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
        body: { courseId }
      });

      if (error) throw error;

      // Refresh data
      loadData();
    } catch (error) {
      console.error('Error starting generation:', error);
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
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Courses</h2>
          <p className="text-muted-foreground">
            Manage and track your course material generation
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="h-4 w-4" />
          {courses.length} courses created
        </div>
      </div>

      {courses.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No courses yet</CardTitle>
            <CardDescription>
              Create your first course to start generating materials with AI
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const pipeline = pipelines.find(p => p.course_id === course.id);
            return (
              <Card key={course.id} className="hover:shadow-lg transition-shadow duration-200 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg leading-tight">{course.title}</CardTitle>
                      <CardDescription className="flex items-center gap-1 text-sm">
                        <BookOpen className="h-3 w-3" />
                        {course.subject}
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
                    {course.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => startGeneration(course.id)}
                        className="flex-1"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Start Generation
                      </Button>
                    )}
                    {course.status === 'completed' && (
                      <Button
                        size="sm"
                        onClick={() => onSelectCourse(course.id)}
                        className="flex-1"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Materials
                      </Button>
                    )}
                    {(course.status === 'generating' || course.status === 'completed') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSelectCourse(course.id)}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground border-t pt-3">
                    Created {format(new Date(course.created_at), 'MMM d, yyyy')}
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
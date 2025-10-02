import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MaterialEditor } from '@/components/MaterialEditor';
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Presentation, 
  BookOpen, 
  ClipboardList, 
  Users, 
  HelpCircle, 
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle,
  Play,
  Edit,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface Course {
  id: string;
  title: string;
  subject: string;
  duration: string;
  level: string;
  environment: string;
  tone: string;
  language: string;
  status: string;
  created_at: string;
}

interface Material {
  id: string;
  course_id: string;
  material_type: string;
  step_order: number;
  title: string;
  content: string | null;
  approved_content: string | null;
  approval_status: string;
  file_path: string | null;
  download_url: string | null;
  status: string;
  created_at: string;
  edited_at: string | null;
}

interface Pipeline {
  id: string;
  current_step: number;
  total_steps: number;
  progress_percent: number;
  status: string;
  error_message: string | null;
  current_material_id: string | null;
  waiting_for_approval: boolean;
}

const materialIcons: { [key: string]: any } = {
  agenda: ClipboardList,
  objectives: FileText,
  slides: Presentation,
  trainer_notes: BookOpen,
  exercises: Users,
  manual: BookOpen,
  tests: HelpCircle,
  resources: ExternalLink,
};

export function MaterialsViewer({ courseId, onBack }: { courseId: string; onBack: () => void }) {
  const { t } = useTranslation(['materials', 'common']);
  const [course, setCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [generationStarted, setGenerationStarted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    
    // Set up real-time updates
    const channel = supabase
      .channel('materials-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'course_materials',
        filter: `course_id=eq.${courseId}`
      }, () => {
        loadData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'generation_pipelines',
        filter: `course_id=eq.${courseId}`
      }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [courseId]);

  const loadData = async () => {
    try {
      // Load course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // Load materials
      const { data: materialsData, error: materialsError } = await supabase
        .from('course_materials')
        .select('*')
        .eq('course_id', courseId)
        .order('step_order');

      if (materialsError) throw materialsError;

      // Load pipeline
      const { data: pipelineData, error: pipelineError } = await supabase
        .from('generation_pipelines')
        .select('*')
        .eq('course_id', courseId)
        .single();

      if (pipelineError) throw pipelineError;

      setCourse(courseData);
      setMaterials(materialsData || []);
      setPipeline(pipelineData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'generating':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-muted" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-muted text-muted-foreground',
      generating: 'bg-primary/20 text-primary',
      completed: 'bg-success/20 text-success',
      failed: 'bg-destructive/20 text-destructive',
      approved: 'bg-success/20 text-success',
      rejected: 'bg-destructive/20 text-destructive'
    };

    return (
      <Badge className={colors[status]}>
        {t(`status.${status}`, { ns: 'materials' })}
      </Badge>
    );
  };

  const startGeneration = async () => {
    try {
      setGenerationStarted(true);
      
      const { error } = await supabase.functions.invoke('generate-course-materials', {
        body: { courseId }
      });

      if (error) throw error;

      toast({
        title: t('generating', { ns: 'materials' }),
        description: t('generatingDescription', { ns: 'materials' }),
      });
    } catch (error) {
      console.error('Error starting generation:', error);
      toast({
        title: t('status.error', { ns: 'materials' }),
        description: t('generatingDescription', { ns: 'materials' }),
        variant: "destructive",
      });
      setGenerationStarted(false);
    }
  };

  const handleMaterialSave = async (materialId: string, content: string) => {
    const { error } = await supabase
      .from('course_materials')
      .update({ 
        approved_content: content, 
        edited_at: new Date().toISOString() 
      })
      .eq('id', materialId);

    if (error) throw error;
    
    await loadData();
  };

  const handleMaterialApprove = async (materialId: string) => {
    const { error } = await supabase
      .from('course_materials')
      .update({ 
        approval_status: 'approved' 
      })
      .eq('id', materialId);

    if (error) throw error;
    
    await loadData();
    setEditingMaterial(null);
  };

  const handleMaterialReject = async (materialId: string) => {
    const { error } = await supabase
      .from('course_materials')
      .update({ 
        approval_status: 'rejected',
        status: 'pending' 
      })
      .eq('id', materialId);

    if (error) throw error;
    
    await loadData();
    setEditingMaterial(null);
  };

  const generateNextMaterial = async () => {
    try {
      const { error } = await supabase.functions.invoke('generate-course-materials', {
        body: { courseId, continueGeneration: true }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error generating next material:', error);
      throw error;
    }
  };

  const canStartGeneration = course?.status === 'draft' && !generationStarted;
  const isInProgress = pipeline?.status === 'running' || pipeline?.waiting_for_approval;
  const currentMaterial = materials.find(m => m.id === pipeline?.current_material_id);
  const nextMaterial = materials.find(m => m.step_order === (currentMaterial?.step_order || 0) + 1);
  const canProceedToNext = currentMaterial?.approval_status === 'approved' && !!nextMaterial;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('noMaterials', { ns: 'materials' })}</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('backToDashboard', { ns: 'materials' })}
        </Button>
      </div>
    );
  }

  // Show material editor if editing
  if (editingMaterial) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setEditingMaterial(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('title', { ns: 'materials' })}
          </Button>
          <div className="flex-1">
            <h2 className="text-3xl font-bold tracking-tight">{course.title}</h2>
            <p className="text-muted-foreground">
              {t('edit', { ns: 'materials' })}: {editingMaterial.title}
            </p>
          </div>
        </div>

        <MaterialEditor
          material={editingMaterial}
          onSave={(content) => handleMaterialSave(editingMaterial.id, content)}
          onApprove={() => handleMaterialApprove(editingMaterial.id)}
          onReject={() => handleMaterialReject(editingMaterial.id)}
          onGenerateNext={generateNextMaterial}
          isGenerating={pipeline?.status === 'running' || false}
          canProceedToNext={!!canProceedToNext}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('actions.back', { ns: 'common' })}
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">{course.title}</h2>
          <p className="text-muted-foreground">
            {course.subject} • {course.duration} • {course.level}
          </p>
        </div>
        {getStatusBadge(course.status)}
      </div>

      {/* Start Generation Button */}
      {canStartGeneration && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Play className="h-6 w-6 text-primary" />
              <div className="flex-1">
                <h3 className="font-semibold text-primary">{t('generating', { ns: 'materials' })}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('generatingDescription', { ns: 'materials' })}
                </p>
              </div>
              <Button onClick={startGeneration} className="ml-auto">
                <Play className="h-4 w-4 mr-2" />
                {t('generating', { ns: 'materials' })}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Step Editing */}
      {isInProgress && currentMaterial && currentMaterial.content && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Edit className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-800 dark:text-orange-300">
                  {t('edit', { ns: 'materials' })}: {currentMaterial.title}
                </h3>
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  {t('generatingDescription', { ns: 'materials' })}
                </p>
              </div>
              <Button 
                onClick={() => setEditingMaterial(currentMaterial)}
                variant="outline"
                className="border-orange-200 text-orange-700 hover:bg-orange-100 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950"
              >
                <Edit className="h-4 w-4 mr-2" />
                {t('edit', { ns: 'materials' })}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {pipeline && pipeline.status !== 'pending' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className={`h-5 w-5 ${pipeline.status === 'running' ? 'animate-spin' : ''}`} />
              {t('generating', { ns: 'materials' })}
            </CardTitle>
            <CardDescription>
              {pipeline.status === 'running' ? t('status.generating', { ns: 'materials' }) : 
               pipeline.status === 'completed' ? t('status.ready', { ns: 'materials' }) :
               pipeline.status === 'failed' ? t('status.error', { ns: 'materials' }) : t('status.generating', { ns: 'materials' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('generating', { ns: 'materials' })}</span>
                <span>{pipeline.progress_percent}%</span>
              </div>
              <Progress value={pipeline.progress_percent} className="h-2" />
              <div className="text-sm text-muted-foreground">
                {pipeline.current_step} / {pipeline.total_steps}
              </div>
            </div>
            {pipeline.error_message && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{pipeline.error_message}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {materials.map((material) => {
          const Icon = materialIcons[material.material_type] || FileText;
          
          return (
            <Card key={material.id} className="relative hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{material.title}</CardTitle>
                      <CardDescription className="text-xs">
                        Step {material.step_order}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusIcon(material.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {material.content && (
                  <div className="text-sm text-muted-foreground line-clamp-3">
                    {material.content.substring(0, 150)}...
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  {getStatusBadge(material.status)}
                  <div className="flex gap-2">
                    {material.status === 'completed' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setEditingMaterial(material)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          {t('edit', { ns: 'materials' })}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          {t('preview', { ns: 'materials' })}
                        </Button>
                        {material.download_url && (
                          <Button size="sm">
                            <Download className="h-3 w-3 mr-1" />
                            {t('download', { ns: 'materials' })}
                          </Button>
                        )}
                      </>
                    )}
                    {(material.content || material.approved_content) && material.status !== 'completed' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setEditingMaterial(material)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        {t('edit', { ns: 'materials' })}
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground border-t pt-2">
                  Created {format(new Date(material.created_at), 'MMM d, HH:mm')}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {course.status === 'completed' && (
        <Card className="border-success/20 bg-success/5 dark:bg-success/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-success" />
              <div>
                <h3 className="font-semibold text-success">{t('status.ready', { ns: 'materials' })}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('generatingDescription', { ns: 'materials' })}
                </p>
              </div>
              <Button className="ml-auto">
                <Download className="h-4 w-4 mr-2" />
                {t('downloadAll', { ns: 'materials' })}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
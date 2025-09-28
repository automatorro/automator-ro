import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Save, 
  Check, 
  X, 
  ArrowRight,
  History,
  Loader2,
  FileText,
  Presentation,
  BookOpen,
  ClipboardList,
  Users,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface Material {
  id: string;
  course_id: string;
  material_type: string;
  step_order: number;
  title: string;
  content: string | null;
  approved_content: string | null;
  approval_status: string;
  status: string;
  created_at: string;
  edited_at: string | null;
}

interface MaterialEditorProps {
  material: Material;
  onSave: (content: string) => Promise<void>;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  onGenerateNext: () => Promise<void>;
  isGenerating: boolean;
  canProceedToNext: boolean;
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

export function MaterialEditor({ 
  material, 
  onSave, 
  onApprove, 
  onReject, 
  onGenerateNext,
  isGenerating,
  canProceedToNext 
}: MaterialEditorProps) {
  const [editContent, setEditContent] = useState(material.content || '');
  const [saving, setSaving] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (material.content) {
      setEditContent(material.approved_content || material.content);
    }
    loadVersions();
  }, [material]);

  const loadVersions = async () => {
    try {
      const { data } = await supabase
        .from('material_versions')
        .select('*')
        .eq('material_id', material.id)
        .order('version_number', { ascending: false })
        .limit(5);
      
      setVersions(data || []);
    } catch (error) {
      console.error('Error loading versions:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editContent);
      
      // Create version entry
      await supabase
        .from('material_versions')
        .insert({
          material_id: material.id,
          content: editContent,
          version_number: versions.length + 1
        });

      toast({
        title: "Content Saved",
        description: "Your edits have been saved successfully!",
      });
      
      loadVersions();
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: "Error",
        description: "Failed to save content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    try {
      await onApprove();
      toast({
        title: "Content Approved",
        description: "Content has been approved and saved as final version.",
      });
    } catch (error) {
      console.error('Error approving:', error);
      toast({
        title: "Error",
        description: "Failed to approve content.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    try {
      await onReject();
      toast({
        title: "Content Rejected",
        description: "Content has been rejected. AI will regenerate it.",
      });
    } catch (error) {
      console.error('Error rejecting:', error);
      toast({
        title: "Error",
        description: "Failed to reject content.",
        variant: "destructive",
      });
    }
  };

  const loadVersion = (versionContent: string) => {
    setEditContent(versionContent);
  };

  const Icon = materialIcons[material.material_type] || FileText;

  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-muted text-muted-foreground',
      approved: 'bg-success/20 text-success',
      rejected: 'bg-destructive/20 text-destructive'
    };

    return (
      <Badge className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                {material.title}
                <Badge variant="outline">Step {material.step_order}</Badge>
              </CardTitle>
              <CardDescription>
                Material Type: {material.material_type.replace('_', ' ')}
              </CardDescription>
            </div>
            {getStatusBadge(material.approval_status)}
          </div>
        </CardHeader>
      </Card>

      {/* Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Content</CardTitle>
          <CardDescription>
            Review and edit the generated content. You can modify it to better fit your needs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Content will appear here after generation..."
            className="min-h-[400px] font-mono text-sm"
            disabled={material.status === 'generating'}
          />
          
          <div className="flex gap-2">
            <Button 
              onClick={handleSave} 
              disabled={saving || editContent === (material.approved_content || material.content)}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
            
            {material.content && material.approval_status === 'pending' && (
              <>
                <Button 
                  onClick={handleApprove}
                  variant="default"
                  className="bg-success hover:bg-success/90"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve & Continue
                </Button>
                
                <Button 
                  onClick={handleReject}
                  variant="destructive"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject & Regenerate
                </Button>
              </>
            )}

            {canProceedToNext && (
              <Button 
                onClick={onGenerateNext}
                disabled={isGenerating}
                className="ml-auto"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                Generate Next Material
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Version History */}
      {versions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History
            </CardTitle>
            <CardDescription>
              Previous versions of this material
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {versions.map((version) => (
                <div key={version.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Version {version.version_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(version.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => loadVersion(version.content)}
                  >
                    Load Version
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
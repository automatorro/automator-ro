import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthPage } from '@/components/AuthPage';
import { Header } from '@/components/Header';
import { CourseBuilder } from '@/components/CourseBuilder';
import { Dashboard } from '@/components/Dashboard';
import { MaterialsViewer } from '@/components/MaterialsViewer';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen } from 'lucide-react';
import { ThemeProvider } from 'next-themes';

type View = 'dashboard' | 'builder' | 'materials';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  useEffect(() => {
    if (user && !loading) {
      setCurrentView('dashboard');
    }
  }, [user, loading]);

  const handleCourseCreated = (courseId: string) => {
    setSelectedCourseId(courseId);
    setCurrentView('materials');
  };

  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setCurrentView('materials');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedCourseId(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {currentView === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                  Create and manage your AI-generated course materials
                </p>
              </div>
              <Button
                onClick={() => setCurrentView('builder')}
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Course
              </Button>
            </div>
            <Dashboard onSelectCourse={handleSelectCourse} />
          </div>
        )}

        {currentView === 'builder' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setCurrentView('dashboard')}
              >
                ← Back to Dashboard
              </Button>
            </div>
            <CourseBuilder onCourseCreated={handleCourseCreated} />
          </div>
        )}

        {currentView === 'materials' && selectedCourseId && (
          <MaterialsViewer
            courseId={selectedCourseId}
            onBack={handleBackToDashboard}
          />
        )}
      </main>
    </div>
  );
}

const Index = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AppContent />
    </ThemeProvider>
  );
};

export default Index;

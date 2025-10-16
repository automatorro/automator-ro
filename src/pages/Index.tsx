import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('dashboard');
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is coming from Google OAuth callback
    const isOAuthCallback = window.location.hash.includes('access_token');
    
    if (!loading && !user && location.pathname !== '/auth' && !isOAuthCallback) {
      // Add a small delay to allow session to establish
      const timer = setTimeout(() => {
        if (!user) {
          navigate('/auth');
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [user, loading, navigate, location]);

  useEffect(() => {
    if (location.pathname.includes('/dashboard/new-course')) {
      setCurrentView('builder');
    } else if (location.pathname.includes('/dashboard/courses/')) {
      const parts = location.pathname.split('/');
      const isEdit = parts[parts.length - 1] === 'edit';
      const courseId = isEdit ? parts[parts.length - 2] : parts[parts.length - 1];
      if (courseId) {
        setSelectedCourseId(courseId);
        setCurrentView(isEdit ? 'builder' : 'materials');
      }
    } else if (location.pathname.includes('/dashboard')) {
      setCurrentView('dashboard');
    }
  }, [location]);

  const handleCourseCreated = (courseId: string) => {
    setSelectedCourseId(courseId);
    navigate(`/dashboard/courses/${courseId}`);
  };

  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    navigate(`/dashboard/courses/${courseId}`);
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
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
                <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
                <p className="text-muted-foreground">{t('subtitle')}</p>
              </div>
              <Button
                onClick={() => navigate('/dashboard/new-course')}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-2xl transition-all hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('newCourse')}
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
                onClick={() => navigate('/dashboard')}
              >
                ← {t('title')}
              </Button>
            </div>
            <CourseBuilder onCourseCreated={handleCourseCreated} courseId={selectedCourseId || undefined} />
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

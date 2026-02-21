import { Header } from '@/components/layout/Header';
import { VideoWizard } from '@/components/VideoWizard';
import { DebugConsole } from '@/components/DebugConsole';

const Index = () => {
  const isDevelopment = import.meta.env.DEV;

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      <Header />

      <main className="relative z-10">
        <VideoWizard />
      </main>

      {/* Debug Console - Development Only */}
      {isDevelopment && <DebugConsole />}
    </div>
  );
};

export default Index;

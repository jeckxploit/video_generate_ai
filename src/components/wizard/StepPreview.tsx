import { motion } from 'framer-motion';
import { Play, Download, RefreshCw, Check, Sparkles, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WizardData } from '@/types/wizard';
import { videoTypes, videoStyles, videoDurations, videoFormats } from '@/data/wizardOptions';
import { useState, useEffect } from 'react';
import { detectConflicts, getUserFriendlySummary } from '@/lib/promptGenerator';
import { ConflictWarning } from './ConflictWarning';

interface StepPreviewProps {
  data: WizardData;
  onGenerate: () => void;
  isGenerating: boolean;
}

const loadingMessages = [
  'Menganalisis preferensi visual...',
  'Menyiapkan scene dan transisi...',
  'Mengoptimalkan durasi dan pacing...',
  'Menerapkan gaya visual...',
  'Rendering frame video...',
  'Finalisasi output...',
];

export const StepPreview = ({ data, onGenerate, isGenerating }: StepPreviewProps) => {
  const [isGenerated, setIsGenerated] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  
  const selectedType = videoTypes.find((t) => t.id === data.videoType);
  const selectedStyle = videoStyles.find((s) => s.id === data.style);
  const selectedDuration = videoDurations.find((d) => d.id === data.duration);
  const selectedFormat = videoFormats.find((f) => f.id === data.format);
  
  const warnings = detectConflicts(data);
  const friendlySummary = getUserFriendlySummary(data);

  // Animate loading progress
  useEffect(() => {
    if (!isGenerating) {
      setLoadingStep(0);
      setProgress(0);
      return;
    }
    
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % loadingMessages.length);
    }, 1500);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 15, 95));
    }, 500);
    
    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [isGenerating]);

  const handleGenerate = () => {
    setProgress(0);
    onGenerate();
    // Simulate generation complete
    setTimeout(() => {
      setProgress(100);
      setIsGenerated(true);
    }, 4500);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl sm:text-4xl font-heading font-bold">
          Review & <span className="text-gradient">Generate</span>
        </h2>
        <p className="text-muted-foreground text-lg">
          AI akan membuat video berdasarkan konfigurasi Anda
        </p>
      </div>

      {/* Conflict Warnings */}
      {warnings.length > 0 && !isGenerated && (
        <ConflictWarning warnings={warnings} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Summary Card - User Friendly */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-glass rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold font-heading">Konfigurasi Video</h3>
          </div>
          
          {/* AI Generated Summary - No technical prompt shown */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">AI akan membuat:</p>
            <p className="font-medium text-foreground">{friendlySummary}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{selectedType?.icon}</span>
                <span className="text-xs text-muted-foreground">Tipe</span>
              </div>
              <div className="font-medium text-sm">{selectedType?.title}</div>
            </div>

            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-4 h-4 rounded ${selectedStyle?.preview}`} />
                <span className="text-xs text-muted-foreground">Gaya</span>
              </div>
              <div className="font-medium text-sm">{selectedStyle?.title}</div>
            </div>

            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Film className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Durasi</span>
              </div>
              <div className="font-medium text-sm">{selectedDuration?.label}</div>
            </div>

            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-3 border border-primary rounded-sm" />
                <span className="text-xs text-muted-foreground">Format</span>
              </div>
              <div className="font-medium text-sm">{selectedFormat?.label} ({selectedFormat?.ratio})</div>
            </div>
          </div>

          {/* User's description - simplified view */}
          <div className="pt-3 border-t border-border">
            <div className="text-xs text-muted-foreground mb-2">Deskripsi Anda</div>
            <p className="text-sm leading-relaxed line-clamp-3">{data.prompt}</p>
          </div>
        </motion.div>

        {/* Preview / Generate Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-glass rounded-xl overflow-hidden"
        >
          {/* Video Preview Area */}
          <div className={`relative aspect-video ${selectedStyle?.preview} flex items-center justify-center`}>
            <div className="absolute inset-0 bg-black/50" />
            
            {isGenerating ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative z-10 w-full px-8 text-center space-y-4"
              >
                {/* Animated spinner */}
                <div className="relative w-20 h-20 mx-auto">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 rounded-full border-4 border-primary/30 border-t-primary"
                  />
                  <div className="absolute inset-2 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{Math.round(progress)}%</span>
                  </div>
                </div>
                
                {/* Loading message */}
                <motion.p 
                  key={loadingStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-white font-medium"
                >
                  {loadingMessages[loadingStep]}
                </motion.p>
                
                {/* Progress bar */}
                <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                
                <p className="text-white/60 text-sm">Estimasi: 30-60 detik</p>
              </motion.div>
            ) : isGenerated ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="relative z-10 text-center space-y-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-16 h-16 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center mx-auto"
                >
                  <Check className="w-8 h-8 text-primary" />
                </motion.div>
                <button className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors mx-auto group">
                  <Play className="w-10 h-10 text-white fill-white ml-1 group-hover:scale-110 transition-transform" />
                </button>
                <p className="text-white text-sm">Klik untuk preview</p>
              </motion.div>
            ) : (
              <div className="relative z-10 text-center space-y-3">
                <motion.div 
                  className="text-6xl mb-4"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🎬
                </motion.div>
                <p className="text-white font-medium">Preview akan muncul di sini</p>
                <p className="text-white/60 text-sm">Klik Generate untuk memulai</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-4 space-y-3">
            {!isGenerated ? (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12 text-base"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Sedang Membuat Video...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Video dengan AI
                  </>
                )}
              </Button>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-center gap-2 text-primary py-2">
                  <Check className="w-5 h-5" />
                  <span className="font-semibold">Video berhasil dibuat!</span>
                </div>
                
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Video (MP4)
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsGenerated(false);
                      setProgress(0);
                    }}
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate Ulang
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                  >
                    <Film className="w-4 h-4 mr-2" />
                    Buat Video Baru
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

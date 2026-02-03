import { motion } from 'framer-motion';
import { Play, Download, RefreshCw, Check, Sparkles, Film, AlertCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WizardData } from '@/types/wizard';
import { videoStyles, videoTypes, videoDurations, videoFormats } from '@/data/wizardOptions';
import { analyzeConfiguration, getDetailedSummary } from '@/lib/promptGenerator';
import { ConflictWarning } from './ConflictWarning';
import { VideoResult, VideoMetadata } from './VideoResult';
import { useVideoGeneration } from '@/hooks/useVideoGeneration';

interface StepPreviewProps {
  data: WizardData;
}

const loadingMessages = [
  'Menganalisis preferensi visual...',
  'Menyiapkan scene dan transisi...',
  'Mengoptimalkan durasi dan pacing...',
  'Menerapkan gaya visual...',
  'Rendering frame video...',
  'Finalisasi output...',
];

export const StepPreview = ({ data }: StepPreviewProps) => {
  const { job, isSubmitting, submitJob, resetJob } = useVideoGeneration();
  
  // Use the enhanced AI analysis
  const analysis = analyzeConfiguration(data);
  const detailedSummary = getDetailedSummary(data);
  const selectedStyle = videoStyles.find((s) => s.id === data.style);
  const selectedType = videoTypes.find((t) => t.id === data.videoType);
  const selectedDuration = videoDurations.find((d) => d.id === data.duration);
  const selectedFormat = videoFormats.find((f) => f.id === data.format);

  const isGenerating = job?.status === 'pending' || job?.status === 'processing';
  const isCompleted = job?.status === 'completed';
  const isFailed = job?.status === 'failed';
  const progress = job?.progress || 0;
  
  // Calculate loading message based on progress
  const loadingStepIndex = Math.min(
    Math.floor((progress / 100) * loadingMessages.length),
    loadingMessages.length - 1
  );

  // Build metadata for VideoResult
  const videoMetadata: VideoMetadata = {
    videoType: data.videoType || '',
    videoTypeLabel: selectedType?.title || 'Tidak dipilih',
    style: data.style || '',
    styleLabel: selectedStyle?.title || 'Tidak dipilih',
    duration: data.duration || '',
    durationLabel: selectedDuration?.label || 'Tidak dipilih',
    format: data.format || '',
    formatLabel: selectedFormat ? `${selectedFormat.label} (${selectedFormat.ratio})` : 'Tidak dipilih',
    userPrompt: data.prompt || '',
  };

  const handleGenerate = async () => {
    try {
      await submitJob(data);
    } catch (error) {
      console.error('Failed to submit job:', error);
    }
  };

  const handleRegenerate = () => {
    resetJob();
  };

  const handleDownload = () => {
    if (job?.videoUrl) {
      window.open(job.videoUrl, '_blank');
    }
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

      {/* Configuration Score & Warnings */}
      {!isCompleted && (
        <div className="space-y-4">
          {/* Score Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3"
          >
            <div className={`
              px-4 py-2 rounded-full font-semibold text-sm
              ${analysis.score >= 90 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                analysis.score >= 70 ? 'bg-primary/20 text-primary border border-primary/30' :
                analysis.score >= 50 ? 'bg-warning/20 text-warning border border-warning/30' :
                'bg-destructive/20 text-destructive border border-destructive/30'}
            `}>
              {analysis.label} • Skor: {analysis.score}/100
            </div>
          </motion.div>

          {/* Warnings */}
          {analysis.warnings.length > 0 && (
            <ConflictWarning warnings={analysis.warnings} />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Summary Card - User Friendly */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-glass rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold font-heading">Konfigurasi Video</h3>
            </div>
          </div>
          
          {/* AI Generated Summary - Human readable */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">AI akan membuat:</p>
            <p className="font-medium text-foreground">{analysis.summary}</p>
          </div>
          
          {/* Detailed Summary Points */}
          <div className="space-y-2">
            {detailedSummary.map((point, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-sm text-muted-foreground bg-muted/20 rounded-lg px-3 py-2"
              >
                {point}
              </motion.div>
            ))}
          </div>

          {/* AI Recommendations */}
          {analysis.recommendations.length > 0 && !isGenerating && !isCompleted && (
            <div className="pt-3 border-t border-border">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  AI akan menambahkan
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {analysis.recommendations.slice(0, 3).map((rec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-start gap-2 bg-muted/30 rounded-lg p-2"
                  >
                    <span className="text-lg flex-shrink-0">{rec.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-foreground">{rec.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{rec.description}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* User's description */}
          <div className="pt-3 border-t border-border">
            <div className="text-xs text-muted-foreground mb-2">Deskripsi Anda</div>
            <p className="text-sm leading-relaxed line-clamp-3">{data.prompt}</p>
          </div>

          {/* Job ID display when processing */}
          {job?.id && (
            <div className="pt-3 border-t border-border">
              <div className="text-xs text-muted-foreground mb-1">Job ID</div>
              <code className="text-xs bg-muted/50 px-2 py-1 rounded font-mono">
                {job.id.slice(0, 8)}...
              </code>
            </div>
          )}
        </motion.div>

        {/* Preview / Generate Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-glass rounded-xl overflow-hidden"
        >
          {/* Show VideoResult when completed */}
          {isCompleted && job?.videoUrl ? (
            <div className="p-4">
              <VideoResult
                videoUrl={job.videoUrl}
                thumbnailUrl={job.thumbnailUrl || undefined}
                onDownload={handleDownload}
                onRegenerate={handleRegenerate}
                isDemo={true}
                metadata={videoMetadata}
              />
            </div>
          ) : (
            <>
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
                      key={loadingStepIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-white font-medium"
                    >
                      {loadingMessages[loadingStepIndex]}
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
                    
                    <p className="text-white/60 text-sm">
                      Status: {job?.status === 'pending' ? 'Menunggu...' : 'Memproses...'}
                    </p>
                  </motion.div>
                ) : isFailed ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative z-10 text-center space-y-4 px-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-destructive/20 backdrop-blur-sm flex items-center justify-center mx-auto">
                      <AlertCircle className="w-8 h-8 text-destructive" />
                    </div>
                    <p className="text-white font-medium">Gagal membuat video</p>
                    <p className="text-white/60 text-sm">{job?.errorMessage || 'Terjadi kesalahan. Silakan coba lagi.'}</p>
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
                {!isFailed ? (
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || isSubmitting}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12 text-base"
                  >
                    {isGenerating || isSubmitting ? (
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
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={handleRegenerate}
                      className="w-full"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Coba Lagi
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.location.reload()}
                      className="w-full"
                    >
                      <Film className="w-4 h-4 mr-2" />
                      Buat Video Baru
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

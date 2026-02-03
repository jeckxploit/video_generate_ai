import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, Download, RotateCcw, Info, ChevronDown, ChevronUp, Film, Palette, Clock, Ratio, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface VideoMetadata {
  videoType: string;
  videoTypeLabel: string;
  style: string;
  styleLabel: string;
  duration: string;
  durationLabel: string;
  format: string;
  formatLabel: string;
  userPrompt: string;
}

interface VideoResultProps {
  videoUrl: string;
  thumbnailUrl?: string;
  onDownload: () => void;
  onRegenerate: () => void;
  isDemo?: boolean;
  metadata?: VideoMetadata;
}

export const VideoResult = ({ 
  videoUrl, 
  thumbnailUrl, 
  onDownload, 
  onRegenerate,
  isDemo = true,
  metadata
}: VideoResultProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showMetadata, setShowMetadata] = useState(true);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const percent = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(percent);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = percent * videoRef.current.duration;
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full space-y-4"
    >
      {/* Demo Label */}
      {isDemo && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/20 border border-warning/30 text-warning text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
            Generated Video (Demo)
          </div>
        </motion.div>
      )}

      {/* Video Player */}
      <div 
        className="relative rounded-xl overflow-hidden bg-black group"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(!isPlaying)}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          poster={thumbnailUrl}
          className="w-full aspect-video object-cover"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          playsInline
        />

        {/* Play Overlay */}
        {!isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
            onClick={togglePlay}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-20 h-20 rounded-full bg-primary/80 backdrop-blur-sm flex items-center justify-center"
            >
              <Play className="w-10 h-10 text-white fill-white ml-1" />
            </motion.div>
          </motion.div>
        )}

        {/* Controls Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showControls || !isPlaying ? 1 : 0 }}
          className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent"
        >
          {/* Progress Bar */}
          <div 
            className="w-full h-1 bg-white/30 rounded-full mb-3 cursor-pointer group/progress"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-primary rounded-full relative transition-all"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button 
                onClick={togglePlay}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white fill-white" />
                )}
              </button>
              <button 
                onClick={toggleMute}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </button>
            </div>

            <button 
              onClick={handleFullscreen}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <Maximize className="w-5 h-5 text-white" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Metadata Panel */}
      {metadata && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-muted/30 rounded-xl border border-border overflow-hidden"
        >
          {/* Panel Header */}
          <button
            onClick={() => setShowMetadata(!showMetadata)}
            className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Detail Konfigurasi Video</span>
            </div>
            {showMetadata ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          <AnimatePresence>
            {showMetadata && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-0 space-y-3">
                  {/* Grid of metadata items */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Video Type */}
                    <div className="bg-background/50 rounded-lg p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Film className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">Tujuan Video</span>
                      </div>
                      <p className="text-sm font-semibold">{metadata.videoTypeLabel}</p>
                    </div>

                    {/* Style */}
                    <div className="bg-background/50 rounded-lg p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Palette className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">Gaya Visual</span>
                      </div>
                      <p className="text-sm font-semibold">{metadata.styleLabel}</p>
                    </div>

                    {/* Duration */}
                    <div className="bg-background/50 rounded-lg p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">Durasi</span>
                      </div>
                      <p className="text-sm font-semibold">{metadata.durationLabel}</p>
                    </div>

                    {/* Format */}
                    <div className="bg-background/50 rounded-lg p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Ratio className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">Aspect Ratio</span>
                      </div>
                      <p className="text-sm font-semibold">{metadata.formatLabel}</p>
                    </div>
                  </div>

                  {/* User Description */}
                  <div className="bg-background/50 rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Deskripsi Anda</span>
                    </div>
                    <p className="text-sm text-foreground line-clamp-3">{metadata.userPrompt}</p>
                  </div>

                  {/* Demo Explanation */}
                  {isDemo && (
                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                      <p className="text-xs text-warning leading-relaxed">
                        <strong>Mode Demo:</strong> Video yang ditampilkan adalah placeholder yang dipilih berdasarkan konfigurasi Anda. 
                        Metadata di atas menunjukkan parameter yang akan digunakan AI sebenarnya untuk menghasilkan video custom sesuai permintaan.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={onDownload}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12"
        >
          <Download className="w-5 h-5 mr-2" />
          Download Video (MP4)
        </Button>
        
        <Button
          variant="outline"
          onClick={onRegenerate}
          className="w-full"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Generate Ulang
        </Button>
      </div>

      {/* Technical Info - only show if no metadata panel */}
      {isDemo && !metadata && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Video placeholder untuk demo. Arsitektur siap untuk API AI Video asli.
          </p>
        </div>
      )}
    </motion.div>
  );
};

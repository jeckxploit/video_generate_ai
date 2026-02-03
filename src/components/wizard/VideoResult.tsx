import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoResultProps {
  videoUrl: string;
  thumbnailUrl?: string;
  onDownload: () => void;
  onRegenerate: () => void;
  isDemo?: boolean;
}

export const VideoResult = ({ 
  videoUrl, 
  thumbnailUrl, 
  onDownload, 
  onRegenerate,
  isDemo = true 
}: VideoResultProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);

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

      {/* Technical Info (collapsed by default in production) */}
      {isDemo && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Video placeholder untuk demo. Arsitektur siap untuk API AI Video asli.
          </p>
        </div>
      )}
    </motion.div>
  );
};

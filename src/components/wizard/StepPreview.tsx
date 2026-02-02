import { motion } from 'framer-motion';
import { Play, Download, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WizardData } from '@/types/wizard';
import { videoTypes, videoStyles, videoDurations, videoFormats } from '@/data/wizardOptions';
import { useState } from 'react';

interface StepPreviewProps {
  data: WizardData;
  onGenerate: () => void;
  isGenerating: boolean;
}

export const StepPreview = ({ data, onGenerate, isGenerating }: StepPreviewProps) => {
  const [isGenerated, setIsGenerated] = useState(false);
  
  const selectedType = videoTypes.find((t) => t.id === data.videoType);
  const selectedStyle = videoStyles.find((s) => s.id === data.style);
  const selectedDuration = videoDurations.find((d) => d.id === data.duration);
  const selectedFormat = videoFormats.find((f) => f.id === data.format);

  const handleGenerate = () => {
    onGenerate();
    // Simulate generation complete after 3 seconds
    setTimeout(() => {
      setIsGenerated(true);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl sm:text-4xl font-heading font-bold">
          Review & <span className="text-gradient">Generate</span>
        </h2>
        <p className="text-muted-foreground text-lg">
          Pastikan semua sudah sesuai sebelum generate video
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-glass rounded-xl p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold font-heading">Ringkasan Video</h3>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{selectedType?.icon}</span>
              <div>
                <div className="text-sm text-muted-foreground">Tipe Video</div>
                <div className="font-medium">{selectedType?.title}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg ${selectedStyle?.preview}`} />
              <div>
                <div className="text-sm text-muted-foreground">Gaya Visual</div>
                <div className="font-medium">{selectedStyle?.title}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                {selectedDuration?.label.split(' ')[0]}
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Durasi</div>
                <div className="font-medium">{selectedDuration?.label}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                {selectedFormat?.ratio}
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Format</div>
                <div className="font-medium">{selectedFormat?.label}</div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border">
            <div className="text-sm text-muted-foreground mb-2">Deskripsi</div>
            <p className="text-sm leading-relaxed">{data.prompt}</p>
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
            <div className="absolute inset-0 bg-black/40" />
            
            {isGenerating ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative z-10 text-center space-y-4"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent mx-auto"
                />
                <p className="text-white font-medium">Sedang membuat video...</p>
                <p className="text-white/60 text-sm">Estimasi: 30-60 detik</p>
              </motion.div>
            ) : isGenerated ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="relative z-10"
              >
                <button className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                  <Play className="w-10 h-10 text-white fill-white ml-1" />
                </button>
              </motion.div>
            ) : (
              <div className="relative z-10 text-center space-y-2">
                <div className="text-6xl mb-4">🎬</div>
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
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Generate Video
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-primary mb-2">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Video berhasil dibuat!</span>
                </div>
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Video
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsGenerated(false)}
                  className="w-full"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Generate Ulang
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

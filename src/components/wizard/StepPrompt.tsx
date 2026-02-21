import { motion } from 'framer-motion';
import { Sparkles, Lightbulb } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface StepPromptProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  videoType: string | null;
}

const promptSuggestions: Record<string, string[]> = {
  promotional: [
    'Tampilkan produk skincare dengan efek glowing dan testimonial singkat',
    'Video coffee shop dengan suasana cozy dan promo spesial weekend',
    'Launching produk fashion dengan model berjalan di runway virtual',
  ],
  explainer: [
    'Jelaskan cara kerja aplikasi fintech dengan animasi step-by-step',
    'Tutorial singkat menggunakan produk SaaS dengan screen recording',
    'Infografis bergerak tentang manfaat investasi reksa dana',
  ],
  social: [
    'Behind the scenes proses pembuatan kue dengan musik upbeat',
    'Day in my life sebagai content creator dengan transisi kreatif',
    'Outfit of the day dengan quick changes dan text overlay trendy',
  ],
  presentation: [
    'Pitch deck startup dengan data visualization yang menarik',
    'Company profile dengan footage kantor dan tim yang profesional',
    'Webinar opening dengan animasi logo dan agenda yang jelas',
  ],
  story: [
    'Perjalanan brand dari garasi hingga sukses dengan foto-foto throwback',
    'Customer success story dengan wawancara dan b-roll produk',
    'Founder story dengan narasi emosional dan visual cinematik',
  ],
  tutorial: [
    'Step-by-step makeup tutorial dengan close-up detail dan tips',
    'Cara memasak resep viral dengan angle overhead yang aesthetic',
    'DIY home decoration dengan before-after yang dramatis',
  ],
};

export const StepPrompt = ({ prompt, onPromptChange, videoType }: StepPromptProps) => {
  const suggestions = videoType ? promptSuggestions[videoType] || [] : [];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center space-y-2 px-2">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold">
          Deskripsikan <span className="text-gradient">videomu</span>
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
          Semakin detail, semakin bagus hasilnya!
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3 sm:space-y-4"
      >
        <div className="relative">
          <Textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Contoh: Buatkan video promosi untuk coffee shop dengan nuansa cozy, tampilkan berbagai varian kopi dengan steam effect, background musik jazz santai, dan teks promo 'Diskon 20% Weekend Special'"
            className="min-h-[150px] sm:min-h-[180px] bg-glass border-border focus:border-primary resize-none text-sm sm:text-base touch-manipulation"
          />
          <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 flex items-center gap-1 text-muted-foreground text-xs sm:text-sm">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{prompt.length} / 500</span>
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground px-1">
              <Lightbulb className="w-4 h-4 text-primary" />
              <span>Butuh inspirasi? Klik salah satu:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => onPromptChange(suggestion)}
                  className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-left rounded-lg bg-secondary hover:bg-secondary/80
                    text-muted-foreground hover:text-foreground transition-all duration-200
                    border border-transparent hover:border-primary/30 touch-manipulation max-w-full"
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

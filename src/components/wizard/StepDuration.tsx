import { motion } from 'framer-motion';
import { videoDurations, videoFormats } from '@/data/wizardOptions';
import { Clock, Monitor, Smartphone, Square } from 'lucide-react';

interface StepDurationProps {
  selectedDuration: string | null;
  selectedFormat: string | null;
  onSelectDuration: (id: string) => void;
  onSelectFormat: (id: string) => void;
}

const formatIcons: Record<string, React.ReactNode> = {
  landscape: <Monitor className="w-5 h-5 sm:w-6 sm:h-6" />,
  portrait: <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />,
  square: <Square className="w-4 h-4 sm:w-5 sm:h-5" />,
};

export const StepDuration = ({
  selectedDuration,
  selectedFormat,
  onSelectDuration,
  onSelectFormat,
}: StepDurationProps) => {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="text-center space-y-2 px-2">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold">
          Berapa <span className="text-gradient">durasi</span> videonya?
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
          Sesuaikan dengan platform dan kebutuhan kontenmu
        </p>
      </div>

      {/* Duration selection */}
      <div className="space-y-3 sm:space-y-4">
        <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          Durasi Video
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {videoDurations.map((duration, index) => (
            <motion.button
              key={duration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelectDuration(duration.id)}
              className={`
                group p-3 sm:p-4 rounded-xl text-center transition-all duration-300
                bg-glass hover:border-primary/50 touch-manipulation
                ${selectedDuration === duration.id ? 'border-primary glow' : ''}
              `}
            >
              <div className="text-lg sm:text-xl md:text-2xl font-heading font-bold text-primary mb-1">
                {duration.label}
              </div>
              <p className="text-xs text-muted-foreground">
                {duration.description}
              </p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Format selection */}
      <div className="space-y-3 sm:space-y-4">
        <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2">
          <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          Format Video
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          {videoFormats.map((format, index) => (
            <motion.button
              key={format.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              onClick={() => onSelectFormat(format.id)}
              className={`
                group p-3 sm:p-4 rounded-xl text-center transition-all duration-300
                bg-glass hover:border-primary/50 flex items-center gap-3 sm:gap-4 touch-manipulation
                ${selectedFormat === format.id ? 'border-primary glow' : ''}
              `}
            >
              <div className="text-primary flex-shrink-0">
                {formatIcons[format.id]}
              </div>
              <div className="text-left min-w-0">
                <div className="text-xs sm:text-sm font-semibold">
                  {format.label} <span className="text-muted-foreground">({format.ratio})</span>
                </div>
                <p className="text-xs text-muted-foreground truncate hidden sm:block">
                  {format.description}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

import { motion } from 'framer-motion';
import { videoStyles } from '@/data/wizardOptions';

interface StepVideoStyleProps {
  selected: string | null;
  onSelect: (id: string) => void;
}

export const StepVideoStyle = ({ selected, onSelect }: StepVideoStyleProps) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center space-y-2 px-2">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold">
          Pilih <span className="text-gradient">gaya visual</span>
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
          Tentukan mood dan estetika untuk videomu
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-8">
        {videoStyles.map((style, index) => (
          <motion.button
            key={style.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelect(style.id)}
            className={`
              group relative overflow-hidden rounded-xl text-left transition-all duration-300
              bg-glass hover:border-primary/50 touch-manipulation
              ${selected === style.id ? 'border-primary glow' : ''}
            `}
          >
            {/* Preview gradient */}
            <div className={`h-20 sm:h-24 ${style.preview} relative`}>
              <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
            </div>

            <div className="p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                {style.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                {style.description}
              </p>
            </div>

            {selected === style.id && (
              <motion.div
                layoutId="selected-style"
                className="absolute inset-0 border-2 border-primary rounded-xl"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

import { motion } from 'framer-motion';
import { videoTypes } from '@/data/wizardOptions';

interface StepVideoTypeProps {
  selected: string | null;
  onSelect: (id: string) => void;
}

export const StepVideoType = ({ selected, onSelect }: StepVideoTypeProps) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center space-y-2 px-2">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold">
          Mau buat video <span className="text-gradient">apa?</span>
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base md:text-lg px-2">
          Pilih jenis video yang sesuai dengan kebutuhanmu
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-8">
        {videoTypes.map((type, index) => (
          <motion.button
            key={type.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelect(type.id)}
            className={`
              group relative p-3 sm:p-4 md:p-6 rounded-xl text-left transition-all duration-300
              bg-glass hover:border-primary/50 touch-manipulation
              ${selected === type.id ? 'border-primary glow' : ''}
            `}
          >
            <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">{type.icon}</div>
            <h3 className="text-base sm:text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
              {type.title}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
              {type.description}
            </p>

            {selected === type.id && (
              <motion.div
                layoutId="selected-type"
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

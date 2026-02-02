import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Lightbulb, X } from 'lucide-react';
import { useState } from 'react';

interface ConflictWarningProps {
  warnings: Array<{
    type: 'warning' | 'suggestion';
    message: string;
  }>;
}

export const ConflictWarning = ({ warnings }: ConflictWarningProps) => {
  const [dismissed, setDismissed] = useState<number[]>([]);
  
  const visibleWarnings = warnings.filter((_, i) => !dismissed.includes(i));
  
  if (visibleWarnings.length === 0) return null;
  
  return (
    <div className="space-y-2">
      <AnimatePresence>
        {warnings.map((warning, index) => {
          if (dismissed.includes(index)) return null;
          
          const isWarning = warning.type === 'warning';
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className={`
                flex items-start gap-3 p-3 rounded-lg border
                ${isWarning 
                  ? 'bg-warning/10 border-warning/30 text-warning' 
                  : 'bg-primary/10 border-primary/30 text-primary'
                }
              `}
            >
              {isWarning ? (
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-sm flex-1">{warning.message}</p>
              <button
                onClick={() => setDismissed(prev => [...prev, index])}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

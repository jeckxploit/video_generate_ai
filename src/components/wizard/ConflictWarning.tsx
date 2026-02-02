import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Lightbulb, Info, X } from 'lucide-react';
import { useState } from 'react';
import { ConflictWarning as ConflictWarningType } from '@/lib/promptGenerator';

interface ConflictWarningProps {
  warnings: ConflictWarningType[];
}

export const ConflictWarning = ({ warnings }: ConflictWarningProps) => {
  const [dismissed, setDismissed] = useState<number[]>([]);
  
  const visibleWarnings = warnings.filter((_, i) => !dismissed.includes(i));
  
  if (visibleWarnings.length === 0) return null;
  
  const getIcon = (type: ConflictWarningType['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />;
      case 'suggestion':
        return <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5" />;
      case 'tip':
        return <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />;
    }
  };
  
  const getStyles = (type: ConflictWarningType['type'], severity: ConflictWarningType['severity']) => {
    if (type === 'warning') {
      return severity === 'high'
        ? 'bg-destructive/10 border-destructive/30 text-destructive'
        : 'bg-warning/10 border-warning/30 text-warning';
    }
    if (type === 'suggestion') {
      return 'bg-primary/10 border-primary/30 text-primary';
    }
    // tip
    return 'bg-muted/30 border-muted/50 text-muted-foreground';
  };
  
  const getLabel = (type: ConflictWarningType['type']) => {
    switch (type) {
      case 'warning':
        return 'Peringatan';
      case 'suggestion':
        return 'Saran';
      case 'tip':
        return 'Tips';
    }
  };
  
  return (
    <div className="space-y-2">
      <AnimatePresence>
        {warnings.map((warning, index) => {
          if (dismissed.includes(index)) return null;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className={`
                flex items-start gap-3 p-3 rounded-lg border
                ${getStyles(warning.type, warning.severity)}
              `}
            >
              {getIcon(warning.type)}
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
                  {getLabel(warning.type)}
                </span>
                <p className="text-sm mt-0.5">{warning.message}</p>
              </div>
              <button
                onClick={() => setDismissed(prev => [...prev, index])}
                className="p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0"
                aria-label="Dismiss"
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

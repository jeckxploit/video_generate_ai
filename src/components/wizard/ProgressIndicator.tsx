import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { WizardStep } from '@/types/wizard';

interface ProgressIndicatorProps {
  currentStep: WizardStep;
  completedSteps: WizardStep[];
}

const steps: { id: WizardStep; label: string }[] = [
  { id: 'type', label: 'Tipe Video' },
  { id: 'style', label: 'Gaya Visual' },
  { id: 'duration', label: 'Durasi' },
  { id: 'prompt', label: 'Deskripsi' },
  { id: 'preview', label: 'Preview' },
];

export const ProgressIndicator = ({ currentStep, completedSteps }: ProgressIndicatorProps) => {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="flex items-center justify-between relative">
        {/* Progress line background */}
        <div className="absolute left-0 right-0 top-5 h-0.5 bg-border" />
        
        {/* Active progress line */}
        <motion.div
          className="absolute left-0 top-5 h-0.5 bg-primary"
          initial={{ width: '0%' }}
          animate={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />

        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === currentStep;
          const isPast = index < currentIndex;

          return (
            <div key={step.id} className="relative flex flex-col items-center z-10">
              <motion.div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  transition-colors duration-300
                  ${isCompleted || isPast ? 'bg-primary text-primary-foreground' : ''}
                  ${isCurrent ? 'bg-primary text-primary-foreground glow' : ''}
                  ${!isCompleted && !isCurrent && !isPast ? 'bg-muted text-muted-foreground' : ''}
                `}
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </motion.div>
              <span
                className={`
                  mt-2 text-xs font-medium hidden sm:block
                  ${isCurrent ? 'text-primary' : 'text-muted-foreground'}
                `}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WizardStep } from '@/types/wizard';

interface WizardNavigationProps {
  currentStep: WizardStep;
  canContinue: boolean;
  onBack: () => void;
  onNext: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export const WizardNavigation = ({
  currentStep,
  canContinue,
  onBack,
  onNext,
  isFirstStep,
  isLastStep,
}: WizardNavigationProps) => {
  if (isLastStep) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between gap-2 sm:gap-4 pt-4 sm:pt-8 border-t border-border"
    >
      <Button
        variant="ghost"
        onClick={onBack}
        disabled={isFirstStep}
        className={`
          ${isFirstStep ? 'invisible' : ''}
          px-2 sm:px-4 text-xs sm:text-sm
        `}
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
        <span className="hidden sm:inline">Kembali</span>
      </Button>

      <Button
        onClick={onNext}
        disabled={!canContinue}
        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 sm:px-8 text-xs sm:text-sm sm:text-base h-9 sm:h-10"
      >
        Lanjut
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1" />
      </Button>
    </motion.div>
  );
};

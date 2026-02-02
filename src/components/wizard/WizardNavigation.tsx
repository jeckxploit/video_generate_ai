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
      className="flex items-center justify-between pt-8 border-t border-border"
    >
      <Button
        variant="ghost"
        onClick={onBack}
        disabled={isFirstStep}
        className={isFirstStep ? 'invisible' : ''}
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        Kembali
      </Button>

      <Button
        onClick={onNext}
        disabled={!canContinue}
        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8"
      >
        Lanjut
        <ChevronRight className="w-5 h-5 ml-1" />
      </Button>
    </motion.div>
  );
};

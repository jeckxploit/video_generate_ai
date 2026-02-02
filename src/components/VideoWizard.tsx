import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WizardStep, WizardData } from '@/types/wizard';
import { ProgressIndicator } from './wizard/ProgressIndicator';
import { StepVideoType } from './wizard/StepVideoType';
import { StepVideoStyle } from './wizard/StepVideoStyle';
import { StepDuration } from './wizard/StepDuration';
import { StepPrompt } from './wizard/StepPrompt';
import { StepPreview } from './wizard/StepPreview';
import { WizardNavigation } from './wizard/WizardNavigation';
import { toast } from 'sonner';

const stepOrder: WizardStep[] = ['type', 'style', 'duration', 'prompt', 'preview'];

export const VideoWizard = () => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('type');
  const [completedSteps, setCompletedSteps] = useState<WizardStep[]>([]);
  const [data, setData] = useState<WizardData>({
    videoType: null,
    style: null,
    duration: null,
    format: null,
    prompt: '',
  });

  const currentIndex = stepOrder.indexOf(currentStep);
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === stepOrder.length - 1;

  const canContinue = useCallback(() => {
    switch (currentStep) {
      case 'type':
        return data.videoType !== null;
      case 'style':
        return data.style !== null;
      case 'duration':
        return data.duration !== null && data.format !== null;
      case 'prompt':
        return data.prompt.trim().length >= 20;
      case 'preview':
        return true;
      default:
        return false;
    }
  }, [currentStep, data]);

  const goToNextStep = () => {
    if (currentIndex < stepOrder.length - 1) {
      setCompletedSteps((prev) => [...prev.filter((s) => s !== currentStep), currentStep]);
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const goToPrevStep = () => {
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  // Removed - now handled by StepPreview internally

  const renderStep = () => {
    switch (currentStep) {
      case 'type':
        return (
          <StepVideoType
            selected={data.videoType}
            onSelect={(id) => setData((prev) => ({ ...prev, videoType: id }))}
          />
        );
      case 'style':
        return (
          <StepVideoStyle
            selected={data.style}
            onSelect={(id) => setData((prev) => ({ ...prev, style: id }))}
          />
        );
      case 'duration':
        return (
          <StepDuration
            selectedDuration={data.duration}
            selectedFormat={data.format}
            onSelectDuration={(id) => setData((prev) => ({ ...prev, duration: id }))}
            onSelectFormat={(id) => setData((prev) => ({ ...prev, format: id }))}
          />
        );
      case 'prompt':
        return (
          <StepPrompt
            prompt={data.prompt}
            onPromptChange={(prompt) => setData((prev) => ({ ...prev, prompt }))}
            videoType={data.videoType}
          />
        );
      case 'preview':
        return (
          <StepPreview data={data} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Progress Indicator */}
        <div className="mb-12">
          <ProgressIndicator currentStep={currentStep} completedSteps={completedSteps} />
        </div>

        {/* Step Content */}
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <WizardNavigation
            currentStep={currentStep}
            canContinue={canContinue()}
            onBack={goToPrevStep}
            onNext={goToNextStep}
            isFirstStep={isFirstStep}
            isLastStep={isLastStep}
          />
        </div>
      </div>
    </div>
  );
};

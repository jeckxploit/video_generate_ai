export interface VideoType {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface VideoStyle {
  id: string;
  title: string;
  description: string;
  preview: string;
}

export interface VideoDuration {
  id: string;
  label: string;
  seconds: number;
  description: string;
}

export interface VideoFormat {
  id: string;
  label: string;
  ratio: string;
  description: string;
}

export interface WizardData {
  videoType: string | null;
  style: string | null;
  duration: string | null;
  format: string | null;
  prompt: string;
}

export type WizardStep = 'type' | 'style' | 'duration' | 'prompt' | 'preview';

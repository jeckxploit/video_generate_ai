import { WizardData } from '@/types/wizard';
import { videoTypes, videoStyles, videoDurations, videoFormats } from '@/data/wizardOptions';

interface ConflictWarning {
  type: 'warning' | 'suggestion';
  message: string;
}

interface PromptResult {
  prompt: string;
  warnings: ConflictWarning[];
}

// Detect configuration conflicts
export const detectConflicts = (data: WizardData): ConflictWarning[] => {
  const warnings: ConflictWarning[] = [];
  
  // Social media content with long duration
  if (data.videoType === 'social' && (data.duration === 'standard' || data.duration === 'long')) {
    warnings.push({
      type: 'warning',
      message: 'Video social media biasanya lebih efektif dengan durasi pendek (15-30 detik)',
    });
  }
  
  // Tutorial with very short duration
  if (data.videoType === 'tutorial' && data.duration === 'short') {
    warnings.push({
      type: 'warning',
      message: 'Tutorial 15 detik mungkin terlalu singkat untuk menjelaskan langkah-langkah dengan jelas',
    });
  }
  
  // Explainer with short duration
  if (data.videoType === 'explainer' && data.duration === 'short') {
    warnings.push({
      type: 'suggestion',
      message: 'Explainer video biasanya membutuhkan waktu lebih untuk menjelaskan konsep dengan baik',
    });
  }
  
  // Presentation with portrait format
  if (data.videoType === 'presentation' && data.format === 'portrait') {
    warnings.push({
      type: 'warning',
      message: 'Format portrait tidak ideal untuk presentasi. Pertimbangkan landscape atau square',
    });
  }
  
  // Corporate style with playful content
  if (data.style === 'corporate' && data.videoType === 'social') {
    warnings.push({
      type: 'suggestion',
      message: 'Gaya corporate mungkin kurang engaging untuk konten social media',
    });
  }
  
  // Retro style with corporate/presentation content
  if (data.style === 'retro' && (data.videoType === 'presentation' || data.videoType === 'corporate')) {
    warnings.push({
      type: 'suggestion',
      message: 'Gaya retro mungkin kurang cocok untuk konteks profesional/bisnis',
    });
  }

  return warnings;
};

// Generate automatic prompt based on selections
export const generateAutoPrompt = (data: WizardData): PromptResult => {
  const selectedType = videoTypes.find(t => t.id === data.videoType);
  const selectedStyle = videoStyles.find(s => s.id === data.style);
  const selectedDuration = videoDurations.find(d => d.id === data.duration);
  const selectedFormat = videoFormats.find(f => f.id === data.format);
  
  const warnings = detectConflicts(data);
  
  // Build context-aware prompt elements
  const typeContext = getTypeContext(data.videoType);
  const styleContext = getStyleContext(data.style);
  const durationContext = getDurationContext(data.duration);
  const formatContext = getFormatContext(data.format);
  
  // Combine user description with auto-generated context
  let finalPrompt = data.prompt.trim();
  
  // Add automatic enhancements
  const enhancements: string[] = [];
  
  if (styleContext) enhancements.push(styleContext);
  if (typeContext) enhancements.push(typeContext);
  if (durationContext) enhancements.push(durationContext);
  if (formatContext) enhancements.push(formatContext);
  
  // This is the internal prompt - not shown to user
  const technicalPrompt = `
${finalPrompt}

Style: ${selectedStyle?.title} - ${styleContext}
Type: ${selectedType?.title} - ${typeContext}
Duration: ${selectedDuration?.label} - Optimized pacing for ${selectedDuration?.seconds} seconds
Format: ${selectedFormat?.ratio} - ${formatContext}
  `.trim();
  
  return {
    prompt: technicalPrompt,
    warnings,
  };
};

function getTypeContext(type: string | null): string {
  const contexts: Record<string, string> = {
    promotional: 'High-energy, attention-grabbing visuals with clear call-to-action moments',
    explainer: 'Clear visual hierarchy, step-by-step flow, informative graphics and text overlays',
    social: 'Vertical-first composition, quick cuts, trending visual patterns, hook in first 3 seconds',
    presentation: 'Professional layouts, data visualization support, clean transitions',
    story: 'Emotional arc, cinematic compositions, narrative-driven sequencing',
    tutorial: 'Screen recording style, numbered steps, highlight annotations, zoom on key areas',
  };
  return contexts[type || ''] || '';
}

function getStyleContext(style: string | null): string {
  const contexts: Record<string, string> = {
    modern: 'Minimalist design, sans-serif typography, smooth transitions, subtle gradients',
    cinematic: 'Film grain, letterbox framing, dramatic lighting, slow-motion moments',
    playful: 'Bright colors, bouncy animations, rounded shapes, fun sound effects',
    corporate: 'Professional color palette, structured layouts, subtle animations',
    retro: 'Vintage filters, analog textures, classic typography, nostalgic color grading',
    futuristic: 'Neon accents, holographic effects, tech UI elements, glitch transitions',
  };
  return contexts[style || ''] || '';
}

function getDurationContext(duration: string | null): string {
  const contexts: Record<string, string> = {
    short: 'Rapid cuts, immediate hook, single key message',
    medium: 'Balanced pacing, 2-3 key points, memorable ending',
    standard: 'Full narrative arc, multiple scenes, comprehensive messaging',
    long: 'In-depth coverage, chapter-like structure, detailed explanations',
  };
  return contexts[duration || ''] || '';
}

function getFormatContext(format: string | null): string {
  const contexts: Record<string, string> = {
    landscape: 'Optimized for desktop viewing and presentations',
    portrait: 'Mobile-first, full-screen vertical experience',
    square: 'Universal social format, centered compositions',
  };
  return contexts[format || ''] || '';
}

// Get user-friendly summary (what we show to user)
export const getUserFriendlySummary = (data: WizardData): string => {
  const selectedType = videoTypes.find(t => t.id === data.videoType);
  const selectedStyle = videoStyles.find(s => s.id === data.style);
  const selectedDuration = videoDurations.find(d => d.id === data.duration);
  const selectedFormat = videoFormats.find(f => f.id === data.format);
  
  return `${selectedType?.title} dengan gaya ${selectedStyle?.title?.toLowerCase()}, durasi ${selectedDuration?.label}, format ${selectedFormat?.ratio}`;
};

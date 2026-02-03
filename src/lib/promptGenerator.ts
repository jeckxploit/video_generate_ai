import { WizardData } from '@/types/wizard';
import { videoTypes, videoStyles, videoDurations, videoFormats } from '@/data/wizardOptions';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface ConflictWarning {
  type: 'warning' | 'suggestion' | 'tip';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface PromptResult {
  prompt: string;
  warnings: ConflictWarning[];
}

export interface AIRecommendation {
  icon: string;
  title: string;
  description: string;
}

export interface ConfigurationAnalysis {
  score: number; // 0-100
  label: string;
  recommendations: AIRecommendation[];
  warnings: ConflictWarning[];
  summary: string;
  detailedSummary: string[];
}

// ============================================
// CONFLICT DETECTION - Enhanced Logic
// ============================================

export const detectConflicts = (data: WizardData): ConflictWarning[] => {
  const warnings: ConflictWarning[] = [];
  
  // ===== DURATION CONFLICTS =====
  
  // Social media with long duration
  if (data.videoType === 'social' && (data.duration === 'standard' || data.duration === 'long')) {
    warnings.push({
      type: 'warning',
      severity: 'high',
      message: 'Video social media biasanya lebih efektif dengan durasi pendek (15-30 detik). Engagement drop setelah 30 detik.',
    });
  }
  
  // Tutorial with very short duration
  if (data.videoType === 'tutorial' && data.duration === 'short') {
    warnings.push({
      type: 'warning',
      severity: 'high',
      message: 'Tutorial 15 detik terlalu singkat untuk menjelaskan langkah-langkah dengan jelas. Minimal 30-60 detik.',
    });
  }
  
  // Explainer with short duration
  if (data.videoType === 'explainer' && data.duration === 'short') {
    warnings.push({
      type: 'suggestion',
      severity: 'medium',
      message: 'Explainer video membutuhkan waktu untuk menjelaskan konsep. Pertimbangkan durasi 30-60 detik.',
    });
  }
  
  // Story with short duration
  if (data.videoType === 'story' && data.duration === 'short') {
    warnings.push({
      type: 'suggestion',
      severity: 'medium',
      message: 'Story telling membutuhkan waktu untuk membangun narasi. Pertimbangkan durasi lebih panjang.',
    });
  }
  
  // Promotional with long duration
  if (data.videoType === 'promotional' && data.duration === 'long') {
    warnings.push({
      type: 'tip',
      severity: 'low',
      message: 'Video promosi panjang cocok untuk brand film atau company profile. Pastikan konten tetap engaging.',
    });
  }
  
  // ===== FORMAT CONFLICTS =====
  
  // Presentation with portrait format
  if (data.videoType === 'presentation' && data.format === 'portrait') {
    warnings.push({
      type: 'warning',
      severity: 'high',
      message: 'Format portrait tidak ideal untuk presentasi. Gunakan landscape (16:9) untuk tampilan optimal di layar.',
    });
  }
  
  // Tutorial with portrait format
  if (data.videoType === 'tutorial' && data.format === 'portrait') {
    warnings.push({
      type: 'suggestion',
      severity: 'medium',
      message: 'Tutorial biasanya lebih jelas di format landscape agar detail langkah terlihat.',
    });
  }
  
  // Social media with landscape format
  if (data.videoType === 'social' && data.format === 'landscape') {
    warnings.push({
      type: 'tip',
      severity: 'low',
      message: 'Untuk Instagram/TikTok, format portrait atau square lebih optimal. Landscape cocok untuk YouTube.',
    });
  }
  
  // ===== STYLE CONFLICTS =====
  
  // Corporate style with social media
  if (data.style === 'corporate' && data.videoType === 'social') {
    warnings.push({
      type: 'suggestion',
      severity: 'medium',
      message: 'Gaya corporate mungkin kurang engaging untuk social media. Pertimbangkan modern atau playful.',
    });
  }
  
  // Retro with corporate/presentation
  if (data.style === 'retro' && (data.videoType === 'presentation' || data.videoType === 'corporate')) {
    warnings.push({
      type: 'suggestion',
      severity: 'medium',
      message: 'Gaya retro mungkin kurang profesional untuk konteks bisnis formal.',
    });
  }
  
  // Playful with presentation
  if (data.style === 'playful' && data.videoType === 'presentation') {
    warnings.push({
      type: 'tip',
      severity: 'low',
      message: 'Gaya playful bisa efektif untuk presentasi internal atau training, tapi kurang cocok untuk klien formal.',
    });
  }
  
  // Cinematic with short duration
  if (data.style === 'cinematic' && data.duration === 'short') {
    warnings.push({
      type: 'suggestion',
      severity: 'medium',
      message: 'Gaya cinematic butuh waktu untuk efek dramatis. Pertimbangkan durasi 30+ detik.',
    });
  }
  
  // Futuristic with retro content mismatch
  if (data.style === 'futuristic' && data.videoType === 'story') {
    warnings.push({
      type: 'tip',
      severity: 'low',
      message: 'Kombinasi futuristic + story cocok untuk sci-fi narrative. Pastikan konten sesuai.',
    });
  }

  return warnings;
};

// ============================================
// CONFIGURATION ANALYSIS
// ============================================

export const analyzeConfiguration = (data: WizardData): ConfigurationAnalysis => {
  const warnings = detectConflicts(data);
  const recommendations: AIRecommendation[] = [];
  
  // Calculate compatibility score
  let score = 100;
  warnings.forEach(w => {
    if (w.severity === 'high') score -= 25;
    else if (w.severity === 'medium') score -= 10;
    else score -= 5;
  });
  score = Math.max(0, Math.min(100, score));
  
  // Generate label based on score
  let label = '';
  if (score >= 90) label = 'Konfigurasi Optimal ✨';
  else if (score >= 70) label = 'Konfigurasi Baik 👍';
  else if (score >= 50) label = 'Perlu Perhatian ⚠️';
  else label = 'Banyak Konflik ❌';
  
  // Generate smart recommendations based on configuration
  recommendations.push(...getSmartRecommendations(data));
  
  // Generate summaries
  const summary = getUserFriendlySummary(data);
  const detailedSummary = getDetailedSummary(data);
  
  return {
    score,
    label,
    recommendations,
    warnings,
    summary,
    detailedSummary,
  };
};

// ============================================
// SMART RECOMMENDATIONS
// ============================================

function getSmartRecommendations(data: WizardData): AIRecommendation[] {
  const recommendations: AIRecommendation[] = [];
  
  // Type-specific recommendations
  if (data.videoType === 'promotional') {
    recommendations.push({
      icon: '🎯',
      title: 'Hook di 3 Detik Pertama',
      description: 'Pastikan ada visual menarik di awal untuk menangkap perhatian viewer.',
    });
    recommendations.push({
      icon: '📣',
      title: 'Call-to-Action Jelas',
      description: 'Akhiri dengan CTA yang kuat seperti "Beli Sekarang" atau "Pelajari Lebih Lanjut".',
    });
  }
  
  if (data.videoType === 'tutorial') {
    recommendations.push({
      icon: '📝',
      title: 'Numbered Steps',
      description: 'AI akan menambahkan penomoran langkah otomatis untuk kejelasan.',
    });
    recommendations.push({
      icon: '🔍',
      title: 'Zoom Annotations',
      description: 'Area penting akan di-highlight dengan zoom dan annotations.',
    });
  }
  
  if (data.videoType === 'social') {
    recommendations.push({
      icon: '⚡',
      title: 'Quick Cuts',
      description: 'AI akan menggunakan transisi cepat untuk menjaga engagement tinggi.',
    });
    recommendations.push({
      icon: '🎵',
      title: 'Trending Audio',
      description: 'Pertimbangkan menambahkan musik yang sedang trending untuk reach lebih luas.',
    });
  }
  
  if (data.videoType === 'story') {
    recommendations.push({
      icon: '🎭',
      title: 'Emotional Arc',
      description: 'AI akan membangun narasi dengan pembukaan, konflik, dan resolusi.',
    });
  }
  
  if (data.videoType === 'explainer') {
    recommendations.push({
      icon: '📊',
      title: 'Visual Infografis',
      description: 'Data dan konsep akan divisualisasikan dengan grafik yang mudah dipahami.',
    });
  }
  
  // Style-specific recommendations
  if (data.style === 'cinematic') {
    recommendations.push({
      icon: '🎬',
      title: 'Letterbox & Color Grading',
      description: 'AI akan menerapkan ratio sinematik dan color grading dramatis.',
    });
  }
  
  if (data.style === 'futuristic') {
    recommendations.push({
      icon: '✨',
      title: 'Efek Holografik',
      description: 'Elemen UI futuristik dan glitch effects akan ditambahkan.',
    });
  }
  
  // Duration-specific recommendations
  if (data.duration === 'short') {
    recommendations.push({
      icon: '⏱️',
      title: 'Single Message Focus',
      description: 'Video akan fokus pada satu pesan utama untuk impact maksimal.',
    });
  }
  
  if (data.duration === 'long') {
    recommendations.push({
      icon: '📑',
      title: 'Chapter Markers',
      description: 'AI akan membagi video menjadi segment-segment yang mudah diikuti.',
    });
  }
  
  return recommendations.slice(0, 4); // Limit to 4 recommendations
};

// ============================================
// PROMPT GENERATION
// ============================================

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
  const userPrompt = data.prompt.trim();
  
  // Build comprehensive internal prompt (not shown to user)
  const technicalPrompt = `
[USER REQUEST]
${userPrompt}

[VIDEO SPECIFICATIONS]
- Type: ${selectedType?.title} (${data.videoType})
- Visual Style: ${selectedStyle?.title} (${data.style})
- Duration: ${selectedDuration?.label} (${selectedDuration?.seconds} seconds)
- Aspect Ratio: ${selectedFormat?.ratio} (${data.format})

[STYLE DIRECTIVES]
${styleContext}

[CONTENT DIRECTIVES]
${typeContext}

[PACING DIRECTIVES]
${durationContext}

[COMPOSITION DIRECTIVES]
${formatContext}

[OPTIMIZATION NOTES]
- Ensure visual hierarchy appropriate for ${selectedFormat?.ratio} viewing
- Maintain consistent ${selectedStyle?.title} aesthetic throughout
- Optimize pacing for ${selectedDuration?.seconds}-second runtime
- Include appropriate transitions for ${selectedType?.title} content
  `.trim();
  
  return {
    prompt: technicalPrompt,
    warnings,
  };
};

// ============================================
// CONTEXT GENERATORS
// ============================================

function getTypeContext(type: string | null): string {
  const contexts: Record<string, string> = {
    promotional: `
- High-energy, attention-grabbing visuals
- Clear call-to-action moments strategically placed
- Product/service showcase with benefit highlights
- Urgency elements where appropriate
- Brand consistency throughout`,
    explainer: `
- Clear visual hierarchy with logical flow
- Step-by-step progression of information
- Informative graphics and text overlays
- Problem → Solution narrative structure
- Key takeaways emphasized visually`,
    social: `
- Mobile-first composition priority
- Quick cuts and dynamic transitions
- Hook within first 3 seconds mandatory
- Trending visual patterns incorporated
- Engagement-optimized pacing`,
    presentation: `
- Professional slide-like layouts
- Data visualization support
- Clean, subtle transitions
- Speaker-friendly pacing
- Key points highlighted clearly`,
    story: `
- Emotional arc with clear narrative
- Cinematic compositions
- Character/subject focus
- Beginning, middle, end structure
- Mood-appropriate music cues`,
    tutorial: `
- Screen recording style layouts
- Numbered steps with clear markers
- Highlight annotations on key areas
- Zoom effects on important details
- Pause points for complex steps`,
  };
  return contexts[type || ''] || '';
}

function getStyleContext(style: string | null): string {
  const contexts: Record<string, string> = {
    modern: `
- Minimalist design philosophy
- Sans-serif typography (clean, bold)
- Smooth easing transitions
- Subtle gradients and shadows
- Generous white space
- Muted color palette with accent pops`,
    cinematic: `
- Film grain texture overlay
- Letterbox framing (2.35:1 feel)
- Dramatic lighting with high contrast
- Slow-motion moments for emphasis
- Deep depth of field effects
- Rich, desaturated color grading`,
    playful: `
- Bright, saturated colors
- Bouncy spring animations
- Rounded shapes and soft edges
- Fun sound effects integration
- Emoji and sticker elements welcome
- Energetic, upbeat pacing`,
    corporate: `
- Professional blue/gray palette
- Structured, grid-based layouts
- Subtle, understated animations
- Clean typography hierarchy
- Data-driven visual elements
- Trust-building imagery`,
    retro: `
- Vintage film filters
- Analog textures and grain
- Classic serif/display typography
- Nostalgic color grading (warm tones)
- VHS/film burn effects optional
- Period-appropriate music style`,
    futuristic: `
- Neon accent lighting
- Holographic UI elements
- Tech interface overlays
- Glitch transitions sparingly
- Cyan/magenta color scheme
- Geometric, angular compositions`,
  };
  return contexts[style || ''] || '';
}

function getDurationContext(duration: string | null): string {
  const contexts: Record<string, string> = {
    short: `
- Rapid cuts (1-2 seconds per scene)
- Immediate hook required
- Single key message focus
- No time for complex narratives
- Punchy, impactful ending`,
    medium: `
- Balanced 3-4 second scenes
- 2-3 key points maximum
- Brief intro, core content, memorable outro
- Moderate transition tempo
- Clear message hierarchy`,
    standard: `
- Full narrative arc possible
- Multiple scenes/chapters
- Comprehensive messaging
- Room for B-roll and details
- Proper pacing variety`,
    long: `
- In-depth coverage expected
- Chapter-like structure
- Detailed explanations
- Story development time
- Varied pacing with rest moments`,
  };
  return contexts[duration || ''] || '';
}

function getFormatContext(format: string | null): string {
  const contexts: Record<string, string> = {
    landscape: `
- 16:9 aspect ratio
- Optimized for desktop/TV viewing
- Horizontal composition priority
- Wide establishing shots possible
- Presentation-friendly layout`,
    portrait: `
- 9:16 aspect ratio
- Mobile-first, full-screen experience
- Vertical composition priority
- Face/subject centered
- Text readable at mobile size`,
    square: `
- 1:1 aspect ratio
- Universal social media format
- Centered compositions
- Works across all platforms
- Balanced visual weight`,
  };
  return contexts[format || ''] || '';
}

// ============================================
// USER-FRIENDLY OUTPUTS
// ============================================

export const getUserFriendlySummary = (data: WizardData): string => {
  const selectedType = videoTypes.find(t => t.id === data.videoType);
  const selectedStyle = videoStyles.find(s => s.id === data.style);
  const selectedDuration = videoDurations.find(d => d.id === data.duration);
  const selectedFormat = videoFormats.find(f => f.id === data.format);
  
  return `${selectedType?.title} dengan gaya ${selectedStyle?.title?.toLowerCase()}, durasi ${selectedDuration?.label}, format ${selectedFormat?.ratio}`;
};

// ============================================
// NATURAL LANGUAGE PROMPT PREVIEW
// ============================================

export const getNaturalLanguagePrompt = (data: WizardData): string => {
  const selectedType = videoTypes.find(t => t.id === data.videoType);
  const selectedStyle = videoStyles.find(s => s.id === data.style);
  const selectedDuration = videoDurations.find(d => d.id === data.duration);
  const selectedFormat = videoFormats.find(f => f.id === data.format);
  
  // Get human-readable format description
  const formatDescription = selectedFormat?.id === 'portrait' 
    ? `format vertikal ${selectedFormat?.ratio}` 
    : selectedFormat?.id === 'landscape' 
      ? `format horizontal ${selectedFormat?.ratio}`
      : `format ${selectedFormat?.label?.toLowerCase()} ${selectedFormat?.ratio}`;
  
  // Get style description in natural language
  const styleMap: Record<string, string> = {
    modern: 'gaya modern clean',
    cinematic: 'gaya sinematik dramatis',
    playful: 'gaya playful dan ceria',
    corporate: 'gaya profesional corporate',
    retro: 'gaya retro vintage',
    futuristic: 'gaya futuristik high-tech',
  };
  const styleDescription = styleMap[data.style || ''] || `gaya ${selectedStyle?.title?.toLowerCase()}`;
  
  // Get type description
  const typeMap: Record<string, string> = {
    promotional: 'Video promosi',
    explainer: 'Video explainer',
    social: 'Video social media',
    presentation: 'Video presentasi',
    story: 'Video storytelling',
    tutorial: 'Video tutorial',
  };
  const typeDescription = typeMap[data.videoType || ''] || `Video ${selectedType?.title?.toLowerCase()}`;
  
  // Get user prompt summary (first 100 chars if too long)
  const userPromptSummary = data.prompt.length > 100 
    ? data.prompt.substring(0, 100).trim() + '...'
    : data.prompt;
  
  // Build natural language prompt
  return `${typeDescription} berdurasi ${selectedDuration?.label}, ${formatDescription}, ${styleDescription}, ${userPromptSummary.toLowerCase().startsWith('tentang') ? '' : 'tentang '}${userPromptSummary.charAt(0).toLowerCase() + userPromptSummary.slice(1)}`;
};

export const getDetailedSummary = (data: WizardData): string[] => {
  const selectedType = videoTypes.find(t => t.id === data.videoType);
  const selectedStyle = videoStyles.find(s => s.id === data.style);
  const selectedDuration = videoDurations.find(d => d.id === data.duration);
  const selectedFormat = videoFormats.find(f => f.id === data.format);
  
  const summaryPoints: string[] = [];
  
  // Type description
  summaryPoints.push(`🎬 Video ${selectedType?.title}: ${getTypeDescription(data.videoType)}`);
  
  // Style description
  summaryPoints.push(`🎨 Gaya ${selectedStyle?.title}: ${getStyleDescription(data.style)}`);
  
  // Duration description
  summaryPoints.push(`⏱️ Durasi ${selectedDuration?.label}: ${getDurationDescription(data.duration)}`);
  
  // Format description
  summaryPoints.push(`📐 Format ${selectedFormat?.ratio}: ${getFormatDescription(data.format)}`);
  
  return summaryPoints;
};

function getTypeDescription(type: string | null): string {
  const descriptions: Record<string, string> = {
    promotional: 'Menarik perhatian dan mendorong aksi dari viewer',
    explainer: 'Menjelaskan konsep kompleks dengan visual yang mudah dipahami',
    social: 'Dioptimalkan untuk engagement tinggi di social media',
    presentation: 'Professional dan informatif untuk konteks bisnis',
    story: 'Membangun koneksi emosional melalui narasi',
    tutorial: 'Panduan langkah-langkah yang jelas dan mudah diikuti',
  };
  return descriptions[type || ''] || '';
}

function getStyleDescription(style: string | null): string {
  const descriptions: Record<string, string> = {
    modern: 'Bersih, minimalis, dan kontemporer',
    cinematic: 'Dramatis dengan nuansa film profesional',
    playful: 'Ceria, berwarna, dan penuh energi',
    corporate: 'Profesional dan terpercaya',
    retro: 'Nostalgia dengan sentuhan vintage',
    futuristic: 'High-tech dengan efek digital canggih',
  };
  return descriptions[style || ''] || '';
}

function getDurationDescription(duration: string | null): string {
  const descriptions: Record<string, string> = {
    short: 'Singkat dan impactful, langsung ke inti',
    medium: 'Cukup waktu untuk 2-3 poin utama',
    standard: 'Ruang untuk narasi lengkap',
    long: 'Mendalam dengan penjelasan detail',
  };
  return descriptions[duration || ''] || '';
}

function getFormatDescription(format: string | null): string {
  const descriptions: Record<string, string> = {
    landscape: 'Optimal untuk YouTube, website, dan presentasi',
    portrait: 'Perfect untuk TikTok, Instagram Reels, dan Stories',
    square: 'Universal, cocok untuk semua platform',
  };
  return descriptions[format || ''] || '';
}

// ============================================
// PROMPT QUALITY CHECKER
// ============================================

export const analyzeUserPrompt = (prompt: string): {
  isGood: boolean;
  suggestions: string[];
  wordCount: number;
} => {
  const wordCount = prompt.trim().split(/\s+/).filter(w => w.length > 0).length;
  const suggestions: string[] = [];
  
  if (wordCount < 5) {
    suggestions.push('Tambahkan lebih banyak detail tentang apa yang ingin ditampilkan');
  }
  
  if (wordCount < 10) {
    suggestions.push('Jelaskan suasana atau mood yang diinginkan');
  }
  
  if (!prompt.toLowerCase().includes('warna') && !prompt.toLowerCase().includes('color')) {
    suggestions.push('Pertimbangkan menyebutkan preferensi warna');
  }
  
  if (!prompt.toLowerCase().includes('musik') && !prompt.toLowerCase().includes('audio') && !prompt.toLowerCase().includes('sound')) {
    suggestions.push('Anda bisa menambahkan preferensi musik/audio');
  }
  
  const isGood = wordCount >= 10 && suggestions.length <= 1;
  
  return { isGood, suggestions, wordCount };
};

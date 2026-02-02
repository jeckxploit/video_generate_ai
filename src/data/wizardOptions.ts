import { VideoType, VideoStyle, VideoDuration, VideoFormat } from '@/types/wizard';

export const videoTypes: VideoType[] = [
  {
    id: 'promotional',
    title: 'Video Promosi',
    description: 'Cocok untuk iklan produk, brand awareness, dan marketing campaign',
    icon: '🎯',
  },
  {
    id: 'explainer',
    title: 'Video Explainer',
    description: 'Jelaskan konsep, produk, atau layanan dengan cara yang menarik',
    icon: '💡',
  },
  {
    id: 'social',
    title: 'Social Media',
    description: 'Konten pendek untuk Instagram, TikTok, YouTube Shorts',
    icon: '📱',
  },
  {
    id: 'presentation',
    title: 'Presentasi',
    description: 'Video untuk pitch deck, webinar, atau materi edukasi',
    icon: '📊',
  },
  {
    id: 'story',
    title: 'Storytelling',
    description: 'Ceritakan kisah brand atau personal dengan visual yang memukau',
    icon: '✨',
  },
  {
    id: 'tutorial',
    title: 'Tutorial',
    description: 'Video panduan langkah demi langkah yang mudah diikuti',
    icon: '📚',
  },
];

export const videoStyles: VideoStyle[] = [
  {
    id: 'modern',
    title: 'Modern & Clean',
    description: 'Desain minimalis dengan tipografi bold dan transisi smooth',
    preview: 'bg-gradient-to-br from-cyan-500 to-blue-600',
  },
  {
    id: 'cinematic',
    title: 'Cinematic',
    description: 'Nuansa film dengan color grading dramatis dan gerakan kamera sinematik',
    preview: 'bg-gradient-to-br from-amber-600 to-orange-900',
  },
  {
    id: 'playful',
    title: 'Playful & Fun',
    description: 'Warna cerah, animasi bouncy, dan elemen dekoratif yang ceria',
    preview: 'bg-gradient-to-br from-pink-500 to-purple-600',
  },
  {
    id: 'corporate',
    title: 'Corporate',
    description: 'Profesional dan formal, cocok untuk bisnis dan presentasi B2B',
    preview: 'bg-gradient-to-br from-slate-600 to-slate-900',
  },
  {
    id: 'retro',
    title: 'Retro & Vintage',
    description: 'Nuansa nostalgia dengan tekstur grain dan palet warna klasik',
    preview: 'bg-gradient-to-br from-yellow-600 to-red-700',
  },
  {
    id: 'futuristic',
    title: 'Futuristic',
    description: 'Tema sci-fi dengan efek neon, hologram, dan teknologi canggih',
    preview: 'bg-gradient-to-br from-violet-600 to-indigo-900',
  },
];

export const videoDurations: VideoDuration[] = [
  {
    id: 'short',
    label: '15 detik',
    seconds: 15,
    description: 'Perfect untuk Instagram Stories & Reels',
  },
  {
    id: 'medium',
    label: '30 detik',
    seconds: 30,
    description: 'Ideal untuk iklan TV dan YouTube pre-roll',
  },
  {
    id: 'standard',
    label: '60 detik',
    seconds: 60,
    description: 'Standar untuk video promosi lengkap',
  },
  {
    id: 'long',
    label: '2 menit',
    seconds: 120,
    description: 'Explainer video dan konten mendalam',
  },
];

export const videoFormats: VideoFormat[] = [
  {
    id: 'landscape',
    label: 'Landscape',
    ratio: '16:9',
    description: 'YouTube, Website, Presentasi',
  },
  {
    id: 'portrait',
    label: 'Portrait',
    ratio: '9:16',
    description: 'TikTok, Instagram Reels, Stories',
  },
  {
    id: 'square',
    label: 'Square',
    ratio: '1:1',
    description: 'Instagram Feed, Facebook',
  },
];

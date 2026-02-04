import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================
// ERROR HANDLING SYSTEM
// ============================================

// Error codes for categorization
enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_PROMPT = "INVALID_PROMPT",
  RATE_LIMIT = "RATE_LIMIT",
  API_TIMEOUT = "API_TIMEOUT",
  API_FAILURE = "API_FAILURE",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  JOB_NOT_FOUND = "JOB_NOT_FOUND",
  INVALID_JOB_ID = "INVALID_JOB_ID",
}

// User-friendly error messages (safe to display)
const USER_FRIENDLY_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.VALIDATION_ERROR]: "Data yang dikirim tidak valid. Silakan periksa konfigurasi video Anda.",
  [ErrorCode.INVALID_PROMPT]: "Deskripsi video tidak valid. Pastikan deskripsi minimal 10 karakter dan tidak mengandung konten yang tidak diizinkan.",
  [ErrorCode.RATE_LIMIT]: "Terlalu banyak permintaan. Silakan tunggu beberapa saat sebelum mencoba lagi.",
  [ErrorCode.API_TIMEOUT]: "Pembuatan video memakan waktu terlalu lama. Silakan coba lagi.",
  [ErrorCode.API_FAILURE]: "Terjadi kendala saat membuat video. Tim kami sedang menangani masalah ini.",
  [ErrorCode.SERVICE_UNAVAILABLE]: "Layanan pembuatan video sedang dalam pemeliharaan. Silakan coba lagi nanti.",
  [ErrorCode.INTERNAL_ERROR]: "Terjadi kesalahan sistem. Silakan coba lagi atau hubungi dukungan.",
  [ErrorCode.JOB_NOT_FOUND]: "Video tidak ditemukan. Mungkin sudah kadaluarsa atau ID tidak valid.",
  [ErrorCode.INVALID_JOB_ID]: "Format ID video tidak valid.",
};

// Custom error class for video generation
class VideoGenerationError extends Error {
  code: ErrorCode;
  userMessage: string;
  statusCode: number;
  retryable: boolean;
  retryAfterSeconds?: number;

  constructor(
    code: ErrorCode,
    technicalMessage: string,
    options?: {
      statusCode?: number;
      retryable?: boolean;
      retryAfterSeconds?: number;
      userMessage?: string;
    }
  ) {
    super(technicalMessage);
    this.name = "VideoGenerationError";
    this.code = code;
    this.userMessage = options?.userMessage || USER_FRIENDLY_MESSAGES[code];
    this.statusCode = options?.statusCode || 500;
    this.retryable = options?.retryable ?? false;
    this.retryAfterSeconds = options?.retryAfterSeconds;
  }

  toSafeResponse() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.userMessage,
        retryable: this.retryable,
        ...(this.retryAfterSeconds && { retryAfterSeconds: this.retryAfterSeconds }),
      },
    };
  }
}

// Helper to create safe error responses
function createErrorResponse(
  error: unknown,
  defaultCode: ErrorCode = ErrorCode.INTERNAL_ERROR
): { response: VideoGenerationError; logMessage: string } {
  if (error instanceof VideoGenerationError) {
    return {
      response: error,
      logMessage: `[${error.code}] ${error.message}`,
    };
  }

  // Handle timeout errors
  if (error instanceof Error) {
    if (error.name === "AbortError" || error.message.includes("timeout")) {
      return {
        response: new VideoGenerationError(
          ErrorCode.API_TIMEOUT,
          error.message,
          { statusCode: 504, retryable: true, retryAfterSeconds: 30 }
        ),
        logMessage: `[TIMEOUT] ${error.message}`,
      };
    }

    // Handle rate limit errors (common patterns from APIs)
    if (
      error.message.includes("rate limit") ||
      error.message.includes("429") ||
      error.message.includes("too many requests")
    ) {
      return {
        response: new VideoGenerationError(
          ErrorCode.RATE_LIMIT,
          error.message,
          { statusCode: 429, retryable: true, retryAfterSeconds: 60 }
        ),
        logMessage: `[RATE_LIMIT] ${error.message}`,
      };
    }

    // Handle service unavailable
    if (
      error.message.includes("503") ||
      error.message.includes("service unavailable") ||
      error.message.includes("maintenance")
    ) {
      return {
        response: new VideoGenerationError(
          ErrorCode.SERVICE_UNAVAILABLE,
          error.message,
          { statusCode: 503, retryable: true, retryAfterSeconds: 300 }
        ),
        logMessage: `[SERVICE_UNAVAILABLE] ${error.message}`,
      };
    }
  }

  // Default internal error
  const message = error instanceof Error ? error.message : "Unknown error";
  return {
    response: new VideoGenerationError(defaultCode, message, { statusCode: 500 }),
    logMessage: `[INTERNAL] ${message}`,
  };
}

// Rate limiting storage (in-memory for edge function)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per minute per session

function checkRateLimit(sessionId: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(sessionId);

  // Clean up expired entries
  if (record && record.resetAt < now) {
    rateLimitStore.delete(sessionId);
  }

  const current = rateLimitStore.get(sessionId);

  if (!current) {
    rateLimitStore.set(sessionId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  current.count++;
  return { allowed: true };
}

// Validate UUID format
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// ============================================
// INPUT VALIDATION SCHEMA
// ============================================

const VALID_VIDEO_TYPES = ["promotional", "explainer", "social", "presentation", "story", "tutorial"] as const;
const VALID_STYLES = ["modern", "cinematic", "playful", "corporate", "retro", "futuristic"] as const;
const VALID_DURATIONS = ["short", "medium", "standard", "long"] as const;
const VALID_FORMATS = ["landscape", "portrait", "square"] as const;

// Forbidden patterns in prompts (safety filter)
const FORBIDDEN_PATTERNS = [
  /\b(hack|exploit|malware|virus)\b/i,
  /\b(weapon|bomb|explosive)\b/i,
  /<script|javascript:|data:/i,
  /\x00|\x1f/g, // Control characters
];

interface VideoJobPayload {
  sessionId: string;
  videoType: string;
  style: string;
  duration: string;
  format: string;
  userPrompt: string;
  generatedPrompt?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  errorCode?: ErrorCode;
  sanitizedPayload?: VideoJobPayload;
}

// ============================================
// INPUT VALIDATION
// ============================================

function validateInput(payload: unknown): ValidationResult {
  const errors: string[] = [];

  if (!payload || typeof payload !== "object") {
    return { 
      valid: false, 
      errors: ["Data permintaan tidak valid"], 
      errorCode: ErrorCode.VALIDATION_ERROR 
    };
  }

  const data = payload as Record<string, unknown>;

  // Required fields validation
  if (!data.sessionId || typeof data.sessionId !== "string") {
    errors.push("Session ID diperlukan");
  }

  if (!data.videoType || typeof data.videoType !== "string") {
    errors.push("Tipe video harus dipilih");
  } else if (!VALID_VIDEO_TYPES.includes(data.videoType as typeof VALID_VIDEO_TYPES[number])) {
    errors.push("Tipe video yang dipilih tidak valid");
  }

  if (!data.style || typeof data.style !== "string") {
    errors.push("Gaya visual harus dipilih");
  } else if (!VALID_STYLES.includes(data.style as typeof VALID_STYLES[number])) {
    errors.push("Gaya visual yang dipilih tidak valid");
  }

  if (!data.duration || typeof data.duration !== "string") {
    errors.push("Durasi video harus dipilih");
  } else if (!VALID_DURATIONS.includes(data.duration as typeof VALID_DURATIONS[number])) {
    errors.push("Durasi yang dipilih tidak valid");
  }

  if (!data.format || typeof data.format !== "string") {
    errors.push("Format video harus dipilih");
  } else if (!VALID_FORMATS.includes(data.format as typeof VALID_FORMATS[number])) {
    errors.push("Format yang dipilih tidak valid");
  }

  // Prompt validation with enhanced checks
  if (!data.userPrompt || typeof data.userPrompt !== "string") {
    errors.push("Deskripsi video diperlukan");
  } else {
    const prompt = String(data.userPrompt).trim();
    
    if (prompt.length < 10) {
      return {
        valid: false,
        errors: ["Deskripsi video minimal 10 karakter"],
        errorCode: ErrorCode.INVALID_PROMPT,
      };
    }
    
    if (prompt.length > 2000) {
      return {
        valid: false,
        errors: ["Deskripsi video maksimal 2000 karakter"],
        errorCode: ErrorCode.INVALID_PROMPT,
      };
    }

    // Check for forbidden patterns
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(prompt)) {
        return {
          valid: false,
          errors: ["Deskripsi mengandung konten yang tidak diizinkan"],
          errorCode: ErrorCode.INVALID_PROMPT,
        };
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, errorCode: ErrorCode.VALIDATION_ERROR };
  }

  // Sanitize input
  const sanitizedPayload: VideoJobPayload = {
    sessionId: String(data.sessionId).trim(),
    videoType: String(data.videoType).trim().toLowerCase(),
    style: String(data.style).trim().toLowerCase(),
    duration: String(data.duration).trim().toLowerCase(),
    format: String(data.format).trim().toLowerCase(),
    userPrompt: String(data.userPrompt).trim(),
  };

  return { valid: true, errors: [], sanitizedPayload };
}

// ============================================
// PROMPT NORMALIZER
// Converts user input into clean, consistent English prompt
// ============================================

const MAX_USER_PROMPT_LENGTH = 200;
const MAX_FINAL_PROMPT_LENGTH = 500;

// Type mappings to English descriptors
const VIDEO_TYPE_ENGLISH: Record<string, string> = {
  promotional: "promotional",
  explainer: "educational explainer",
  social: "social media",
  presentation: "presentation",
  story: "storytelling",
  tutorial: "tutorial",
};

// Style mappings to English descriptors
const STYLE_ENGLISH: Record<string, string> = {
  modern: "modern clean style",
  cinematic: "cinematic",
  playful: "playful animated",
  corporate: "professional corporate",
  retro: "retro vintage",
  futuristic: "futuristic sci-fi",
};

// Duration mappings
const DURATION_ENGLISH: Record<string, string> = {
  short: "15 seconds",
  medium: "30 seconds",
  standard: "60 seconds",
  long: "2 minutes",
};

// Format mappings
const FORMAT_ENGLISH: Record<string, string> = {
  landscape: "horizontal 16:9",
  portrait: "vertical 9:16",
  square: "square 1:1",
};

// Camera/motion style based on video type
const MOTION_STYLE: Record<string, string> = {
  promotional: "dynamic camera movement",
  explainer: "smooth transitions",
  social: "fast-paced editing",
  presentation: "steady professional shots",
  story: "cinematic camera flow",
  tutorial: "clear focused framing",
};

/**
 * Cleans and normalizes user input text
 * - Removes excessive whitespace
 * - Removes special characters that could break prompts
 * - Truncates to max length
 * - Basic normalization for consistency
 */
function normalizeUserInput(input: string): string {
  let cleaned = input
    // Remove multiple spaces/newlines
    .replace(/\s+/g, " ")
    // Remove potentially problematic characters
    .replace(/[<>{}[\]\\]/g, "")
    // Remove quotes that could break JSON
    .replace(/["'`]/g, "'")
    // Trim whitespace
    .trim();

  // Truncate if too long, but try to end at word boundary
  if (cleaned.length > MAX_USER_PROMPT_LENGTH) {
    cleaned = cleaned.substring(0, MAX_USER_PROMPT_LENGTH);
    const lastSpace = cleaned.lastIndexOf(" ");
    if (lastSpace > MAX_USER_PROMPT_LENGTH * 0.7) {
      cleaned = cleaned.substring(0, lastSpace);
    }
    cleaned = cleaned.trim();
  }

  return cleaned;
}

/**
 * Extracts key topics/subjects from user prompt
 * Returns a clean, focused content description
 */
function extractContentFocus(userPrompt: string): string {
  const normalized = normalizeUserInput(userPrompt);
  
  // Remove common filler words for more focused prompt
  const fillerWords = [
    "tolong", "buatkan", "buat", "saya", "ingin", "mau", "video", "tentang",
    "please", "create", "make", "want", "need", "about", "the", "a", "an",
    "yang", "untuk", "dengan", "dan", "atau", "ini", "itu"
  ];
  
  let focused = normalized.toLowerCase();
  fillerWords.forEach(word => {
    focused = focused.replace(new RegExp(`\\b${word}\\b`, "gi"), " ");
  });
  
  // Clean up and capitalize first letter
  focused = focused.replace(/\s+/g, " ").trim();
  if (focused.length > 0) {
    focused = focused.charAt(0).toUpperCase() + focused.slice(1);
  }
  
  return focused || normalized;
}

/**
 * Generates a normalized, natural English prompt for AI Video API
 * Format: "[Style] [type] video about [content], duration [X], [format], [motion style]."
 */
function generateNormalizedPrompt(payload: VideoJobPayload): string {
  const style = STYLE_ENGLISH[payload.style] || "modern clean style";
  const type = VIDEO_TYPE_ENGLISH[payload.videoType] || "promotional";
  const duration = DURATION_ENGLISH[payload.duration] || "30 seconds";
  const format = FORMAT_ENGLISH[payload.format] || "horizontal 16:9";
  const motion = MOTION_STYLE[payload.videoType] || "smooth camera movement";
  
  // Extract and clean user content
  const contentFocus = extractContentFocus(payload.userPrompt);
  
  // Build natural English prompt
  const parts = [
    `${style.charAt(0).toUpperCase() + style.slice(1)} ${type} video`,
    contentFocus ? `about ${contentFocus}` : "",
    `duration ${duration}`,
    format,
    motion,
  ].filter(Boolean);
  
  let finalPrompt = parts.join(", ") + ".";
  
  // Ensure final prompt doesn't exceed max length
  if (finalPrompt.length > MAX_FINAL_PROMPT_LENGTH) {
    // Shorten content focus if needed
    const maxContentLength = MAX_FINAL_PROMPT_LENGTH - 150; // Reserve space for other parts
    const shortenedContent = contentFocus.substring(0, maxContentLength);
    const lastSpace = shortenedContent.lastIndexOf(" ");
    const truncatedContent = lastSpace > 0 ? shortenedContent.substring(0, lastSpace) : shortenedContent;
    
    const shortParts = [
      `${style.charAt(0).toUpperCase() + style.slice(1)} ${type} video`,
      truncatedContent ? `about ${truncatedContent}` : "",
      `duration ${duration}`,
      format,
      motion,
    ].filter(Boolean);
    
    finalPrompt = shortParts.join(", ") + ".";
  }
  
  return finalPrompt;
}

/**
 * Generates detailed prompt for internal logging/storage
 * This is NOT sent to the AI API
 */
function generateDetailedPrompt(payload: VideoJobPayload): string {
  return `
[INTERNAL REFERENCE - NOT FOR AI API]
Type: ${payload.videoType}
Style: ${payload.style}
Duration: ${payload.duration}
Format: ${payload.format}
Original User Input: ${payload.userPrompt}
---
NORMALIZED AI PROMPT:
${generateNormalizedPrompt(payload)}
`.trim();
}

// ============================================
// VIDEO GENERATION SERVICE INTERFACE
// This abstraction allows easy replacement with real AI API
// ============================================

interface VideoGenerationResult {
  videoUrl: string;
  thumbnailUrl: string;
  isDemo: boolean;
}

interface VideoGenerationService {
  generate(jobId: string, payload: VideoJobPayload, onProgress: (progress: number) => Promise<void>): Promise<VideoGenerationResult>;
}

// ============================================
// DEMO/SIMULATION SERVICE
// Replace this with real AI Video API implementation
// ============================================

class DemoVideoService implements VideoGenerationService {
  // Video mapping by type - education/tutorial focused
  private readonly educationVideos = [
    "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  ];

  // Social media / modern style videos
  private readonly socialVideos = [
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  ];

  // Cinematic style videos
  private readonly cinematicVideos = [
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  ];

  // Playful/animated style videos
  private readonly animatedVideos = [
    "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  ];

  // Corporate/professional videos
  private readonly corporateVideos = [
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  ];

  // General promotional videos
  private readonly promotionalVideos = [
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  ];

  // Thumbnails mapped by category
  private readonly thumbnailsByCategory: Record<string, string[]> = {
    education: [
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=640&h=360&fit=crop",
    ],
    social: [
      "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=640&h=360&fit=crop",
    ],
    cinematic: [
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=640&h=360&fit=crop",
    ],
    animated: [
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=640&h=360&fit=crop",
    ],
    corporate: [
      "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=640&h=360&fit=crop",
    ],
    promotional: [
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1551434678-e076c223a692?w=640&h=360&fit=crop",
    ],
  };

  private selectVideoByConfig(videoType: string, style: string): { category: string; videos: string[] } {
    // Priority 1: Style-based selection
    if (style === 'cinematic') {
      return { category: 'cinematic', videos: this.cinematicVideos };
    }
    if (style === 'playful' || style === 'retro') {
      return { category: 'animated', videos: this.animatedVideos };
    }
    if (style === 'corporate') {
      return { category: 'corporate', videos: this.corporateVideos };
    }
    if (style === 'futuristic' || style === 'modern') {
      // For modern/futuristic, check type for more specific mapping
      if (videoType === 'social') {
        return { category: 'social', videos: this.socialVideos };
      }
      return { category: 'cinematic', videos: this.cinematicVideos };
    }

    // Priority 2: Type-based selection
    if (videoType === 'tutorial' || videoType === 'explainer' || videoType === 'presentation') {
      return { category: 'education', videos: this.educationVideos };
    }
    if (videoType === 'social') {
      return { category: 'social', videos: this.socialVideos };
    }
    if (videoType === 'story') {
      return { category: 'cinematic', videos: this.cinematicVideos };
    }
    if (videoType === 'promotional') {
      return { category: 'promotional', videos: this.promotionalVideos };
    }

    // Default fallback
    return { category: 'promotional', videos: this.promotionalVideos };
  }

  async generate(
    jobId: string, 
    payload: VideoJobPayload, 
    onProgress: (progress: number) => Promise<void>
  ): Promise<VideoGenerationResult> {
    console.log(`[DemoService] Starting video generation for job: ${jobId}`);
    console.log(`[DemoService] User prompt: ${payload.userPrompt}`);
    console.log(`[DemoService] Configuration:`, {
      type: payload.videoType,
      style: payload.style,
      duration: payload.duration,
      format: payload.format,
    });

    // Simulate AI processing stages with realistic timing
    const stages = [
      { progress: 5, delay: 500, message: "Initializing AI model..." },
      { progress: 15, delay: 1000, message: "Parsing prompt..." },
      { progress: 25, delay: 1500, message: "Analyzing visual requirements..." },
      { progress: 40, delay: 2000, message: "Generating scene compositions..." },
      { progress: 55, delay: 2000, message: "Applying style transfer..." },
      { progress: 70, delay: 1500, message: "Rendering frames..." },
      { progress: 85, delay: 1500, message: "Encoding video..." },
      { progress: 95, delay: 1000, message: "Finalizing output..." },
    ];

    for (const stage of stages) {
      await new Promise((resolve) => setTimeout(resolve, stage.delay));
      console.log(`[DemoService] ${stage.message}`);
      await onProgress(stage.progress);
    }

    // Smart video selection based on user configuration
    const { category, videos } = this.selectVideoByConfig(payload.videoType, payload.style);
    const randomIndex = Math.floor(Math.random() * videos.length);
    const selectedVideo = videos[randomIndex];

    // Get matching thumbnail
    const thumbnails = this.thumbnailsByCategory[category] || this.thumbnailsByCategory.promotional;
    const thumbnailIndex = Math.floor(Math.random() * thumbnails.length);
    const selectedThumbnail = thumbnails[thumbnailIndex];

    console.log(`[DemoService] Selected category: ${category}`);
    console.log(`[DemoService] Selected video: ${selectedVideo}`);

    return {
      videoUrl: selectedVideo,
      thumbnailUrl: selectedThumbnail,
      isDemo: true,
    };
  }
}

// ============================================
// REAL AI VIDEO API SERVICE (Template)
// Uncomment and implement when integrating real API
// ============================================

/*
class RealAIVideoService implements VideoGenerationService {
  private readonly apiKey: string;
  private readonly apiEndpoint: string;

  constructor() {
    this.apiKey = Deno.env.get("AI_VIDEO_API_KEY") || "";
    this.apiEndpoint = Deno.env.get("AI_VIDEO_API_ENDPOINT") || "https://api.example.com/v1";
  }

  async generate(
    jobId: string,
    payload: VideoJobPayload,
    onProgress: (progress: number) => Promise<void>
  ): Promise<VideoGenerationResult> {
    // 1. Submit generation request
    const submitResponse = await fetch(`${this.apiEndpoint}/generate`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: payload.generatedPrompt,
        style: payload.style,
        duration: payload.duration,
        format: payload.format,
      }),
    });

    const { taskId } = await submitResponse.json();

    // 2. Poll for completion
    while (true) {
      const statusResponse = await fetch(`${this.apiEndpoint}/status/${taskId}`, {
        headers: { "Authorization": `Bearer ${this.apiKey}` },
      });

      const status = await statusResponse.json();
      await onProgress(status.progress);

      if (status.status === "completed") {
        return {
          videoUrl: status.videoUrl,
          thumbnailUrl: status.thumbnailUrl,
          isDemo: false,
        };
      }

      if (status.status === "failed") {
        throw new Error(status.error || "Video generation failed");
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}
*/

// ============================================
// SERVICE FACTORY
// Switch between demo and real API here
// ============================================

function getVideoService(): VideoGenerationService {
  // Check if real API is configured
  const hasRealAPI = Deno.env.get("AI_VIDEO_API_KEY");
  
  if (hasRealAPI) {
    console.log("[Factory] Using Real AI Video Service");
    // return new RealAIVideoService();
  }
  
  console.log("[Factory] Using Demo Video Service");
  return new DemoVideoService();
}

// ============================================
// JOB PROCESSOR WITH ENHANCED ERROR HANDLING
// ============================================

async function processVideoJob(supabase: any, jobId: string, payload: VideoJobPayload) {
  console.log(`[Processor] Starting job: ${jobId}`);
  
  const videoService = getVideoService();

  try {
    // Update status to processing
    await supabase
      .from("video_jobs")
      .update({ status: "processing", progress: 0 })
      .eq("id", jobId);

    // Progress callback for the service with timeout protection
    const onProgress = async (progress: number) => {
      const { error } = await supabase
        .from("video_jobs")
        .update({ progress })
        .eq("id", jobId);
      
      if (error) {
        console.error(`[Processor] Error updating progress: ${error.message}`);
      }
    };

    // Generate video with timeout protection
    const GENERATION_TIMEOUT = 120000; // 2 minutes
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new VideoGenerationError(
          ErrorCode.API_TIMEOUT,
          "Video generation exceeded maximum time limit",
          { statusCode: 504, retryable: true, retryAfterSeconds: 30 }
        ));
      }, GENERATION_TIMEOUT);
    });

    const result = await Promise.race([
      videoService.generate(jobId, payload, onProgress),
      timeoutPromise,
    ]);

    // Mark as completed
    const { error: completeError } = await supabase
      .from("video_jobs")
      .update({
        status: "completed",
        progress: 100,
        video_url: result.videoUrl,
        thumbnail_url: result.thumbnailUrl,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (completeError) {
      throw new VideoGenerationError(
        ErrorCode.INTERNAL_ERROR,
        `Database error: ${completeError.message}`
      );
    }

    console.log(`[Processor] Job ${jobId} completed successfully`);
    return result;

  } catch (error) {
    const { response: errorResponse, logMessage } = createErrorResponse(error);
    console.error(`[Processor] Job ${jobId} failed: ${logMessage}`);
    
    // Store user-friendly error message in database
    await supabase
      .from("video_jobs")
      .update({
        status: "failed",
        error_message: errorResponse.userMessage,
      })
      .eq("id", jobId);

    throw errorResponse;
  }
}

// ============================================
// HTTP HANDLER WITH COMPREHENSIVE ERROR HANDLING
// ============================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // ========== SUBMIT NEW JOB ==========
    if (req.method === "POST" && action === "submit") {
      let rawPayload;
      try {
        rawPayload = await req.json();
      } catch {
        throw new VideoGenerationError(
          ErrorCode.VALIDATION_ERROR,
          "Invalid JSON body",
          { statusCode: 400 }
        );
      }
      
      // Validate input
      const validation = validateInput(rawPayload);
      if (!validation.valid) {
        console.error("[API] Validation failed:", validation.errors);
        throw new VideoGenerationError(
          validation.errorCode || ErrorCode.VALIDATION_ERROR,
          validation.errors.join(", "),
          { 
            statusCode: 400,
            userMessage: validation.errors[0] || USER_FRIENDLY_MESSAGES[ErrorCode.VALIDATION_ERROR],
          }
        );
      }

      const payload = validation.sanitizedPayload!;
      
      // Check rate limit
      const rateCheck = checkRateLimit(payload.sessionId);
      if (!rateCheck.allowed) {
        console.warn(`[API] Rate limit exceeded for session: ${payload.sessionId}`);
        throw new VideoGenerationError(
          ErrorCode.RATE_LIMIT,
          `Rate limit exceeded for session ${payload.sessionId}`,
          { 
            statusCode: 429, 
            retryable: true, 
            retryAfterSeconds: rateCheck.retryAfterSeconds,
          }
        );
      }

      console.log("[API] Received validated job submission:", payload.userPrompt.slice(0, 50) + "...");

      // Generate the normalized prompt for AI API
      const normalizedPrompt = generateNormalizedPrompt(payload);
      const detailedPrompt = generateDetailedPrompt(payload);
      console.log("[API] Normalized prompt:", normalizedPrompt);
      console.log("[API] Prompt length:", normalizedPrompt.length);

      // Create job in database with generated prompt
      const { data: job, error: insertError } = await supabase
        .from("video_jobs")
        .insert({
          session_id: payload.sessionId,
          video_type: payload.videoType,
          style: payload.style,
          duration: payload.duration,
          format: payload.format,
          user_prompt: payload.userPrompt,
          generated_prompt: detailedPrompt,
          status: "pending",
          progress: 0,
        })
        .select()
        .single();

      if (insertError) {
        console.error("[API] Error creating job:", insertError);
        throw new VideoGenerationError(
          ErrorCode.INTERNAL_ERROR,
          `Database insert error: ${insertError.message}`
        );
      }

      console.log("[API] Job created:", job.id);

      // Prepare payload with normalized prompt for AI processing
      const processingPayload: VideoJobPayload = {
        ...payload,
        generatedPrompt: normalizedPrompt,
      };

      // Start background processing
      processVideoJob(supabase, job.id, processingPayload).catch((err) => {
        const { logMessage } = createErrorResponse(err);
        console.error(`[API] Background processing error: ${logMessage}`);
      });

      return new Response(
        JSON.stringify({
          success: true,
          jobId: job.id,
          message: "Pembuatan video dimulai",
          normalizedPrompt: normalizedPrompt,
          isDemo: !Deno.env.get("AI_VIDEO_API_KEY"),
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ========== GET JOB STATUS ==========
    if (req.method === "GET" && action === "status") {
      const jobId = url.searchParams.get("jobId");
      
      if (!jobId) {
        throw new VideoGenerationError(
          ErrorCode.VALIDATION_ERROR,
          "jobId parameter is required",
          { statusCode: 400, userMessage: "ID video diperlukan" }
        );
      }

      // Validate UUID format
      if (!isValidUUID(jobId)) {
        throw new VideoGenerationError(
          ErrorCode.INVALID_JOB_ID,
          `Invalid UUID format: ${jobId}`,
          { statusCode: 400 }
        );
      }

      const { data: job, error: fetchError } = await supabase
        .from("video_jobs")
        .select("*")
        .eq("id", jobId)
        .maybeSingle();

      if (fetchError) {
        console.error("[API] Error fetching job:", fetchError);
        throw new VideoGenerationError(
          ErrorCode.INTERNAL_ERROR,
          `Database fetch error: ${fetchError.message}`
        );
      }

      if (!job) {
        throw new VideoGenerationError(
          ErrorCode.JOB_NOT_FOUND,
          `Job not found: ${jobId}`,
          { statusCode: 404 }
        );
      }

      // Return safe response without internal details
      return new Response(
        JSON.stringify({
          id: job.id,
          status: job.status,
          progress: job.progress,
          video_url: job.video_url,
          thumbnail_url: job.thumbnail_url,
          error_message: job.error_message, // Already sanitized in processor
          created_at: job.created_at,
          completed_at: job.completed_at,
          isDemo: !Deno.env.get("AI_VIDEO_API_KEY"),
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ========== INVALID REQUEST ==========
    throw new VideoGenerationError(
      ErrorCode.VALIDATION_ERROR,
      "Invalid action or method",
      { statusCode: 400, userMessage: "Permintaan tidak valid" }
    );

  } catch (error) {
    // Centralized error handling
    const { response: errorResponse, logMessage } = createErrorResponse(error);
    console.error(`[API] Error: ${logMessage}`);

    const responseBody = errorResponse.toSafeResponse();
    
    // Add Retry-After header for rate limits
    const headers: Record<string, string> = {
      ...corsHeaders,
      "Content-Type": "application/json",
    };
    
    if (errorResponse.retryAfterSeconds) {
      headers["Retry-After"] = String(errorResponse.retryAfterSeconds);
    }

    return new Response(
      JSON.stringify(responseBody),
      {
        status: errorResponse.statusCode,
        headers,
      }
    );
  }
});

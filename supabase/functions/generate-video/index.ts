import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================
// INPUT VALIDATION SCHEMA
// ============================================

const VALID_VIDEO_TYPES = ["promotional", "explainer", "social", "presentation", "story", "tutorial"] as const;
const VALID_STYLES = ["modern", "cinematic", "playful", "corporate", "retro", "futuristic"] as const;
const VALID_DURATIONS = ["short", "medium", "standard", "long"] as const;
const VALID_FORMATS = ["landscape", "portrait", "square"] as const;

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
  sanitizedPayload?: VideoJobPayload;
}

// ============================================
// INPUT VALIDATION
// ============================================

function validateInput(payload: unknown): ValidationResult {
  const errors: string[] = [];

  if (!payload || typeof payload !== "object") {
    return { valid: false, errors: ["Invalid request body"] };
  }

  const data = payload as Record<string, unknown>;

  // Required fields validation
  if (!data.sessionId || typeof data.sessionId !== "string") {
    errors.push("sessionId is required and must be a string");
  }

  if (!data.videoType || typeof data.videoType !== "string") {
    errors.push("videoType is required and must be a string");
  } else if (!VALID_VIDEO_TYPES.includes(data.videoType as typeof VALID_VIDEO_TYPES[number])) {
    errors.push(`videoType must be one of: ${VALID_VIDEO_TYPES.join(", ")}`);
  }

  if (!data.style || typeof data.style !== "string") {
    errors.push("style is required and must be a string");
  } else if (!VALID_STYLES.includes(data.style as typeof VALID_STYLES[number])) {
    errors.push(`style must be one of: ${VALID_STYLES.join(", ")}`);
  }

  if (!data.duration || typeof data.duration !== "string") {
    errors.push("duration is required and must be a string");
  } else if (!VALID_DURATIONS.includes(data.duration as typeof VALID_DURATIONS[number])) {
    errors.push(`duration must be one of: ${VALID_DURATIONS.join(", ")}`);
  }

  if (!data.format || typeof data.format !== "string") {
    errors.push("format is required and must be a string");
  } else if (!VALID_FORMATS.includes(data.format as typeof VALID_FORMATS[number])) {
    errors.push(`format must be one of: ${VALID_FORMATS.join(", ")}`);
  }

  if (!data.userPrompt || typeof data.userPrompt !== "string") {
    errors.push("userPrompt is required and must be a string");
  } else if (data.userPrompt.length < 10) {
    errors.push("userPrompt must be at least 10 characters");
  } else if (data.userPrompt.length > 2000) {
    errors.push("userPrompt must not exceed 2000 characters");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
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
// JOB PROCESSOR
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

    // Progress callback for the service
    const onProgress = async (progress: number) => {
      const { error } = await supabase
        .from("video_jobs")
        .update({ progress })
        .eq("id", jobId);
      
      if (error) {
        console.error(`[Processor] Error updating progress: ${error.message}`);
      }
    };

    // Generate video
    const result = await videoService.generate(jobId, payload, onProgress);

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
      throw completeError;
    }

    console.log(`[Processor] Job ${jobId} completed successfully`);
    return result;

  } catch (error) {
    console.error(`[Processor] Job ${jobId} failed:`, error);
    
    await supabase
      .from("video_jobs")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
      })
      .eq("id", jobId);

    throw error;
  }
}

// ============================================
// HTTP HANDLER
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
      const rawPayload = await req.json();
      
      // Validate input
      const validation = validateInput(rawPayload);
      if (!validation.valid) {
        console.error("[API] Validation failed:", validation.errors);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Validation failed",
            details: validation.errors,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const payload = validation.sanitizedPayload!;
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
          generated_prompt: detailedPrompt, // Store detailed version for reference
          status: "pending",
          progress: 0,
        })
        .select()
        .single();

      if (insertError) {
        console.error("[API] Error creating job:", insertError);
        throw insertError;
      }

      console.log("[API] Job created:", job.id);

      // Prepare payload with normalized prompt for AI processing
      const processingPayload: VideoJobPayload = {
        ...payload,
        generatedPrompt: normalizedPrompt, // Use normalized prompt for AI API
      };

      // Start background processing
      processVideoJob(supabase, job.id, processingPayload).catch((err) => {
        console.error("[API] Background processing error:", err);
      });

      return new Response(
        JSON.stringify({
          success: true,
          jobId: job.id,
          message: "Video generation started",
          normalizedPrompt: normalizedPrompt, // Show the clean prompt to frontend
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
        return new Response(
          JSON.stringify({ error: "jobId is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data: job, error: fetchError } = await supabase
        .from("video_jobs")
        .select("*")
        .eq("id", jobId)
        .maybeSingle();

      if (fetchError) {
        console.error("[API] Error fetching job:", fetchError);
        throw fetchError;
      }

      if (!job) {
        return new Response(
          JSON.stringify({ error: "Job not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          ...job,
          isDemo: true, // Always demo for now
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ========== INVALID REQUEST ==========
    return new Response(
      JSON.stringify({ error: "Invalid action or method" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("[API] Edge function error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

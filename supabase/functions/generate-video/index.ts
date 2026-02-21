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

  const message = error instanceof Error ? error.message : "Unknown error";
  return {
    response: new VideoGenerationError(defaultCode, message, { statusCode: 500 }),
    logMessage: `[INTERNAL] ${message}`,
  };
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

function checkRateLimit(sessionId: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(sessionId);

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

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// ============================================
// INPUT VALIDATION
// ============================================

const VALID_VIDEO_TYPES = ["promotional", "explainer", "social", "presentation", "story", "tutorial"] as const;
const VALID_STYLES = ["modern", "cinematic", "playful", "corporate", "retro", "futuristic"] as const;
const VALID_DURATIONS = ["short", "medium", "standard", "long"] as const;
const VALID_FORMATS = ["landscape", "portrait", "square"] as const;

const FORBIDDEN_PATTERNS = [
  /\b(hack|exploit|malware|virus)\b/i,
  /\b(weapon|bomb|explosive)\b/i,
  /<script|javascript:|data:/i,
  /\x00|\x1f/g,
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
// PROMPT GENERATION FOR REPLICATE API
// ============================================

const VIDEO_TYPE_ENGLISH: Record<string, string> = {
  promotional: "promotional advertisement",
  explainer: "educational explainer",
  social: "social media content",
  presentation: "professional presentation",
  story: "cinematic storytelling",
  tutorial: "step-by-step tutorial",
};

const STYLE_ENGLISH: Record<string, string> = {
  modern: "modern clean aesthetic with minimalist design",
  cinematic: "cinematic with dramatic lighting and film grain",
  playful: "playful and colorful animated style",
  corporate: "professional corporate business style",
  retro: "retro vintage aesthetic with nostalgic feel",
  futuristic: "futuristic sci-fi with neon and holographic elements",
};

const DURATION_SECONDS: Record<string, number> = {
  short: 4,
  medium: 4,
  standard: 4,
  long: 4,
};

const FORMAT_RATIO: Record<string, string> = {
  landscape: "16:9",
  portrait: "9:16",
  square: "1:1",
};

function normalizeUserInput(input: string): string {
  let cleaned = input
    .replace(/\s+/g, " ")
    .replace(/[<>{}[\]\\]/g, "")
    .replace(/["'`]/g, "'")
    .trim();

  if (cleaned.length > 200) {
    cleaned = cleaned.substring(0, 200);
    const lastSpace = cleaned.lastIndexOf(" ");
    if (lastSpace > 140) {
      cleaned = cleaned.substring(0, lastSpace);
    }
    cleaned = cleaned.trim();
  }

  return cleaned;
}

function generateReplicatePrompt(payload: VideoJobPayload): string {
  const type = VIDEO_TYPE_ENGLISH[payload.videoType] || "promotional video";
  const style = STYLE_ENGLISH[payload.style] || "modern clean style";
  const userContent = normalizeUserInput(payload.userPrompt);

  // Build detailed prompt for Stable Video Diffusion / Zeroscope
  const promptParts = [
    `High quality ${type}`,
    style,
    userContent ? `featuring ${userContent}` : "",
    "smooth motion, professional quality, detailed visuals",
  ].filter(Boolean);

  return promptParts.join(", ");
}

function generateDetailedPrompt(payload: VideoJobPayload): string {
  return `
[INTERNAL REFERENCE]
Type: ${payload.videoType}
Style: ${payload.style}
Duration: ${payload.duration}
Format: ${payload.format}
Original User Input: ${payload.userPrompt}
---
AI PROMPT:
${generateReplicatePrompt(payload)}
`.trim();
}

// ============================================
// REPLICATE API SERVICE
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
// DEMO SERVICE (Fallback)
// ============================================

class DemoVideoService implements VideoGenerationService {
  private readonly demoVideos = [
    "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  ];

  private readonly thumbnails = [
    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=640&h=360&fit=crop",
    "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=640&h=360&fit=crop",
  ];

  async generate(
    jobId: string,
    payload: VideoJobPayload,
    onProgress: (progress: number) => Promise<void>
  ): Promise<VideoGenerationResult> {
    console.log(`[DemoService] Starting demo generation for job: ${jobId}`);

    const stages = [
      { progress: 10, delay: 800 },
      { progress: 30, delay: 1000 },
      { progress: 50, delay: 1200 },
      { progress: 70, delay: 1000 },
      { progress: 90, delay: 800 },
      { progress: 100, delay: 500 },
    ];

    for (const stage of stages) {
      await new Promise((resolve) => setTimeout(resolve, stage.delay));
      await onProgress(stage.progress);
    }

    const randomIndex = Math.floor(Math.random() * this.demoVideos.length);
    const thumbIndex = Math.floor(Math.random() * this.thumbnails.length);

    return {
      videoUrl: this.demoVideos[randomIndex],
      thumbnailUrl: this.thumbnails[thumbIndex],
      isDemo: true,
    };
  }
}

// ============================================
// REPLICATE AI VIDEO SERVICE
// ============================================

class ReplicateVideoService implements VideoGenerationService {
  private readonly apiKey: string;
  private readonly replicateBaseUrl = "https://api.replicate.com/v1";

  constructor() {
    this.apiKey = Deno.env.get("REPLICATE_API_TOKEN") || Deno.env.get("REPLICATE_API_KEY") || "";
    console.log(`[ReplicateService] Initialized with API key: ${this.apiKey ? 'present' : 'missing'}`);
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.replicateBaseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "Prefer": "wait",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(`Replicate API error: ${response.status} - ${errorData.detail || JSON.stringify(errorData)}`);
    }

    return response.json();
  }

  async generate(
    jobId: string,
    payload: VideoJobPayload,
    onProgress: (progress: number) => Promise<void>
  ): Promise<VideoGenerationResult> {
    console.log(`[ReplicateService] Starting video generation for job: ${jobId}`);
    console.log(`[ReplicateService] User prompt: ${payload.userPrompt}`);
    console.log(`[ReplicateService] Config:`, {
      type: payload.videoType,
      style: payload.style,
      duration: payload.duration,
      format: payload.format,
    });

    // Generate prompt for Replicate
    const prompt = generateReplicatePrompt(payload);
    console.log(`[ReplicateService] Generated prompt: ${prompt}`);

    // Get aspect ratio based on format
    let aspectRatio = "16:9";
    if (payload.format === "portrait") {
      aspectRatio = "9:16";
    } else if (payload.format === "square") {
      aspectRatio = "1:1";
    }

    // Use Stable Video Diffusion model
    // Model: stability-ai/stable-video-diffusion or lucataco/zeroscope
    const modelVersion = "lucataco/zeroscope-v2-xl:9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351";

    // Submit generation request
    console.log(`[ReplicateService] Submitting prediction to Replicate...`);
    
    const prediction = await this.makeRequest("/predictions", {
      method: "POST",
      body: JSON.stringify({
        version: modelVersion,
        input: {
          prompt: prompt,
          num_frames: 24,
          fps: 8,
          width: payload.format === "landscape" ? 1024 : payload.format === "square" ? 576 : 576,
          height: payload.format === "landscape" ? 576 : payload.format === "square" ? 576 : 1024,
          guidance_scale: 17.5,
          num_inference_steps: 50,
        },
      }),
    });

    console.log(`[ReplicateService] Prediction created: ${prediction.id}`);
    console.log(`[ReplicateService] Initial status: ${prediction.status}`);

    // Poll for completion
    let currentStatus = prediction.status;
    let result = prediction;

    while (currentStatus === "starting" || currentStatus === "processing") {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      result = await this.makeRequest(`/predictions/${prediction.id}`);
      currentStatus = result.status;

      console.log(`[ReplicateService] Status: ${currentStatus}, Progress: ${result.progress || 0}%`);

      // Update progress
      const progress = result.progress ? Math.round(result.progress) : 
                       currentStatus === "starting" ? 10 : 
                       currentStatus === "processing" ? 50 : 90;
      await onProgress(progress);

      if (currentStatus === "succeeded") {
        console.log(`[ReplicateService] Generation succeeded!`);
        break;
      }

      if (currentStatus === "failed" || currentStatus === "canceled") {
        throw new VideoGenerationError(
          ErrorCode.API_FAILURE,
          result.error || "Video generation failed",
          { statusCode: 500, retryable: true }
        );
      }
    }

    // Extract video URL from result
    const videoUrl = result.output?.[0] || result.output;
    
    if (!videoUrl) {
      throw new VideoGenerationError(
        ErrorCode.API_FAILURE,
        "No video URL in response",
        { statusCode: 500 }
      );
    }

    console.log(`[ReplicateService] Video URL: ${videoUrl}`);

    // Generate thumbnail from video (use first frame or create placeholder)
    const thumbnailUrl = result.output?.thumbnail || 
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=640&h=360&fit=crop";

    // Update progress to 100%
    await onProgress(100);

    return {
      videoUrl,
      thumbnailUrl,
      isDemo: false,
    };
  }
}

// ============================================
// SERVICE FACTORY
// ============================================

async function getReplicateApiKey(supabase: any): Promise<string | null> {
  // First, try environment variable
  const envKey = Deno.env.get("REPLICATE_API_TOKEN") || Deno.env.get("REPLICATE_API_KEY");
  if (envKey && envKey !== "your_replicate_api_key_here") {
    console.log("[Factory] Using API key from environment variable");
    return envKey;
  }

  // Fallback: Try to get from database
  try {
    const { data, error } = await supabase
      .from("api_keys")
      .select("key_value")
      .eq("key_name", "REPLICATE_API_TOKEN")
      .eq("is_active", true)
      .single();

    if (error || !data) {
      console.log("[Factory] No API key found in database");
      return null;
    }

    console.log("[Factory] Using API key from database");
    return data.key_value;
  } catch (error) {
    console.log("[Factory] Error fetching API key from database:", error);
    return null;
  }
}

async function getVideoService(supabase: any): Promise<VideoGenerationService> {
  const replicateKey = await getReplicateApiKey(supabase);

  if (replicateKey) {
    console.log("[Factory] Using Replicate AI Video Service");
    const service = new ReplicateVideoService();
    (service as any).apiKey = replicateKey;
    return service;
  }

  console.log("[Factory] Using Demo Video Service (no valid API key)");
  return new DemoVideoService();
}

// ============================================
// JOB PROCESSOR
// ============================================

async function processVideoJob(supabase: any, jobId: string, payload: VideoJobPayload) {
  console.log(`[Processor] Starting job: ${jobId}`);

  const videoService = await getVideoService(supabase);

  try {
    await supabase
      .from("video_jobs")
      .update({ status: "processing", progress: 0 })
      .eq("id", jobId);

    const onProgress = async (progress: number) => {
      const { error } = await supabase
        .from("video_jobs")
        .update({ progress })
        .eq("id", jobId);

      if (error) {
        console.error(`[Processor] Error updating progress: ${error.message}`);
      }
    };

    const GENERATION_TIMEOUT = 180000; // 3 minutes for Replicate
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new VideoGenerationError(
          ErrorCode.API_TIMEOUT,
          "Video generation exceeded maximum time limit",
          { statusCode: 504, retryable: true, retryAfterSeconds: 60 }
        ));
      }, GENERATION_TIMEOUT);
    });

    const result = await Promise.race([
      videoService.generate(jobId, payload, onProgress),
      timeoutPromise,
    ]);

    await supabase
      .from("video_jobs")
      .update({
        status: "completed",
        progress: 100,
        video_url: result.videoUrl,
        thumbnail_url: result.thumbnailUrl,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    console.log(`[Processor] Job ${jobId} completed successfully`);
    return result;

  } catch (error) {
    const { response: errorResponse, logMessage } = createErrorResponse(error);
    console.error(`[Processor] Job ${jobId} failed: ${logMessage}`);

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
// HTTP HANDLER
// ============================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

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

      const normalizedPrompt = generateReplicatePrompt(payload);
      const detailedPrompt = generateDetailedPrompt(payload);
      console.log("[API] Normalized prompt:", normalizedPrompt);

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

      const processingPayload: VideoJobPayload = {
        ...payload,
        generatedPrompt: normalizedPrompt,
      };

      processVideoJob(supabase, job.id, processingPayload).catch((err) => {
        const { logMessage } = createErrorResponse(err);
        console.error(`[API] Background processing error: ${logMessage}`);
      });

      const hasRealAPI = !!(Deno.env.get("REPLICATE_API_TOKEN") || Deno.env.get("REPLICATE_API_KEY"));

      return new Response(
        JSON.stringify({
          success: true,
          jobId: job.id,
          message: "Pembuatan video dimulai",
          normalizedPrompt: normalizedPrompt,
          isDemo: !hasRealAPI,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (req.method === "GET" && action === "status") {
      const jobId = url.searchParams.get("jobId");

      if (!jobId) {
        throw new VideoGenerationError(
          ErrorCode.VALIDATION_ERROR,
          "jobId parameter is required",
          { statusCode: 400, userMessage: "ID video diperlukan" }
        );
      }

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

      return new Response(
        JSON.stringify({
          id: job.id,
          status: job.status,
          progress: job.progress,
          video_url: job.video_url,
          thumbnail_url: job.thumbnail_url,
          error_message: job.error_message,
          created_at: job.created_at,
          completed_at: job.completed_at,
          isDemo: !(Deno.env.get("REPLICATE_API_TOKEN") || Deno.env.get("REPLICATE_API_KEY")),
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    throw new VideoGenerationError(
      ErrorCode.VALIDATION_ERROR,
      "Invalid action or method",
      { statusCode: 400, userMessage: "Permintaan tidak valid" }
    );

  } catch (error) {
    const { response: errorResponse, logMessage } = createErrorResponse(error);
    console.error(`[API] Error: ${logMessage}`);

    const responseBody = errorResponse.toSafeResponse();

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

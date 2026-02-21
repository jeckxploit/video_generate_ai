import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================
// SIMPLE API KEY CHECK
// ============================================

async function getReplicateApiKey(supabase: any): Promise<string | null> {
  console.log("🔑 Checking for Replicate API key...");
  
  // Check environment variable (from Supabase Secrets)
  const envKey = Deno.env.get("REPLICATE_API_TOKEN") || Deno.env.get("REPLICATE_API_KEY") || "";
  
  console.log("📝 Environment key check:");
  console.log("   - Present:", envKey ? "YES" : "NO");
  console.log("   - Length:", envKey ? envKey.length : 0);
  console.log("   - Starts with:", envKey ? envKey.substring(0, 5) : "N/A");
  console.log("   - Is placeholder:", envKey === "your_replicate_api_key_here" || envKey === "YOUR_REPLICATE_API_TOKEN_HERE" ? "YES" : "NO");
  
  if (envKey && envKey.length > 10 && !envKey.includes("your_replicate") && !envKey.includes("YOUR_REPLICATE")) {
    console.log("✅ Using API key from environment variable");
    return envKey;
  }
  
  console.log("⚠️ No valid API key in environment");
  
  // Fallback to database
  try {
    console.log("📊 Trying database...");
    const { data, error } = await supabase
      .from("api_keys")
      .select("key_value")
      .eq("key_name", "REPLICATE_API_TOKEN")
      .eq("is_active", true)
      .single();

    if (error) {
      console.log("❌ Database error:", error.message);
      return null;
    }

    const dbKey = data?.key_value || "";
    console.log("📝 Database key check:");
    console.log("   - Present:", dbKey ? "YES" : "NO");
    console.log("   - Length:", dbKey ? dbKey.length : 0);
    
    if (dbKey && dbKey.length > 10 && !dbKey.includes("your_replicate") && !dbKey.includes("YOUR_REPLICATE")) {
      console.log("✅ Using API key from database");
      return dbKey;
    }
    
    console.log("❌ Database key is placeholder");
    return null;
  } catch (error) {
    console.log("❌ Database fetch error:", error);
    return null;
  }
}

// ============================================
// DEMO VIDEO SERVICE
// ============================================

class DemoVideoService {
  private readonly demoVideos = [
    "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  ];

  private readonly thumbnails = [
    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=640&h=360&fit=crop",
    "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=640&h=360&fit=crop",
  ];

  async generate(jobId: string, onProgress: (progress: number) => Promise<void>) {
    console.log("🎬 Demo Service: Starting demo generation");
    
    const stages = [10, 30, 50, 70, 90, 100];
    for (const progress of stages) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await onProgress(progress);
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

class ReplicateVideoService {
  private readonly apiKey: string;
  private readonly replicateBaseUrl = "https://api.replicate.com/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    console.log("🤖 Replicate Service initialized");
    console.log("🔑 API Key length:", apiKey.length);
    console.log("🔑 API Key starts with:", apiKey.substring(0, 5) + "...");
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

  async generate(jobId: string, payload: any, onProgress: (progress: number) => Promise<void>) {
    console.log("🎬 Replicate Service: Starting AI video generation");
    console.log("📝 Job ID:", jobId);
    console.log("📝 User prompt:", payload.userPrompt?.substring(0, 100));

    // Generate enhanced prompt
    const prompt = this.generateEnhancedPrompt(payload);
    const negativePrompt = "low quality, blurry, distorted, deformed, ugly, bad anatomy, disfigured, poorly drawn, watermark, signature, text overlay, title";
    
    console.log("✨ Generated prompt:", prompt.substring(0, 200) + "...");
    console.log("🚫 Negative prompt:", negativePrompt);

    // Zeroscope v2 XL model
    const modelVersion = "lucataco/zeroscope-v2-xl:9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351";

    console.log("📤 Submitting to Replicate...");

    const prediction = await this.makeRequest("/predictions", {
      method: "POST",
      body: JSON.stringify({
        version: modelVersion,
        input: {
          prompt: prompt,
          negative_prompt: negativePrompt,
          num_frames: 24,
          fps: 8,
          width: payload.format === "landscape" ? 1024 : 576,
          height: payload.format === "landscape" ? 576 : 1024,
          guidance_scale: 17.5,
          num_inference_steps: 50,
          seed: Math.floor(Math.random() * 1000000),
        },
      }),
    });

    console.log("✅ Prediction created:", prediction.id);
    console.log("📊 Initial status:", prediction.status);

    // Poll for completion
    let result = prediction;
    while (result.status === "starting" || result.status === "processing") {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      result = await this.makeRequest(`/predictions/${prediction.id}`);
      
      console.log("📊 Status:", result.status, "| Progress:", result.progress || 0, "%");
      
      const progress = result.progress ? Math.round(result.progress) : result.status === "starting" ? 10 : 50;
      await onProgress(progress);

      if (result.status === "succeeded") {
        console.log("✅ Generation succeeded!");
        break;
      }

      if (result.status === "failed" || result.status === "canceled") {
        throw new Error(`Generation failed: ${result.error || "Unknown error"}`);
      }
    }

    const videoUrl = result.output?.[0] || result.output;
    if (!videoUrl) {
      throw new Error("No video URL in response");
    }

    console.log("🎬 Video URL:", videoUrl);

    const thumbnailUrl = result.output?.thumbnail || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=640&h=360&fit=crop";

    await onProgress(100);

    return {
      videoUrl,
      thumbnailUrl,
      isDemo: false,
    };
  }

  private generateEnhancedPrompt(payload: any): string {
    const typeDescriptions: Record<string, string> = {
      promotional: "A professional promotional video showcasing",
      explainer: "An educational video explaining",
      social: "Engaging social media content featuring",
      presentation: "A professional presentation about",
      story: "A cinematic story about",
      tutorial: "A step-by-step tutorial demonstrating",
    };

    const styleDescriptions: Record<string, string> = {
      modern: "modern clean aesthetic with minimalist design",
      cinematic: "cinematic with dramatic lighting and film grain",
      playful: "playful and colorful animated style",
      corporate: "professional corporate business style",
      retro: "retro vintage aesthetic with nostalgic feel",
      futuristic: "futuristic sci-fi with neon and holographic elements",
    };

    const typeDesc = typeDescriptions[payload.videoType] || "A video about";
    const styleDesc = styleDescriptions[payload.style] || "modern clean style";
    const userContent = payload.userPrompt?.substring(0, 500) || "";

    const promptParts = [
      `${typeDesc}: ${userContent}`,
      styleDesc,
      "high quality, professional, detailed, sharp focus, 4K",
      "smooth motion, natural movement, fluid transitions",
      "professional lighting, well-lit, clear visibility",
      "well-composed, balanced framing, professional cinematography",
    ];

    return promptParts.join(", ");
  }
}

// ============================================
// MAIN HANDLER
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

    // Handle POST - Submit job
    if (req.method === "POST" && action === "submit") {
      const payload = await req.json();
      
      console.log("📥 Received job submission");
      console.log("📝 Session ID:", payload.sessionId);
      console.log("📝 Video Type:", payload.videoType);
      console.log("📝 Style:", payload.style);
      console.log("📝 User Prompt:", payload.userPrompt?.substring(0, 50) + "...");

      // Validate input
      if (!payload.userPrompt || payload.userPrompt.length < 10) {
        return new Response(
          JSON.stringify({ error: "Deskripsi video minimal 10 karakter" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create job in database
      const { data: job, error: insertError } = await supabase
        .from("video_jobs")
        .insert({
          session_id: payload.sessionId,
          video_type: payload.videoType,
          style: payload.style,
          duration: payload.duration,
          format: payload.format,
          user_prompt: payload.userPrompt,
          generated_prompt: payload.generatedPrompt,
          status: "pending",
          progress: 0,
        })
        .select()
        .single();

      if (insertError) {
        console.error("❌ Database insert error:", insertError);
        throw insertError;
      }

      console.log("✅ Job created:", job.id);

      // Get API key and service
      const apiKey = await getReplicateApiKey(supabase);
      const videoService = apiKey ? new ReplicateVideoService(apiKey) : new DemoVideoService();
      
      const isDemo = !apiKey;
      console.log(isDemo ? "⚠️ USING DEMO SERVICE" : "✅ USING REPLICATE AI SERVICE");

      // Process job in background
      processVideoJob(supabase, job.id, payload, videoService, isDemo).catch((err) => {
        console.error("❌ Background processing error:", err);
      });

      return new Response(
        JSON.stringify({
          success: true,
          jobId: job.id,
          isDemo: isDemo,
          message: isDemo ? "Demo mode - no API key configured" : "AI generation started",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle GET - Check status
    if (req.method === "GET" && action === "status") {
      const jobId = url.searchParams.get("jobId");
      
      if (!jobId) {
        return new Response(
          JSON.stringify({ error: "jobId required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: job } = await supabase
        .from("video_jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (!job) {
        return new Response(
          JSON.stringify({ error: "Job not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
          isDemo: job.is_demo,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ============================================
// JOB PROCESSOR
// ============================================

async function processVideoJob(
  supabase: any,
  jobId: string,
  payload: any,
  videoService: any,
  isDemo: boolean
) {
  console.log("⚙️ Processing job:", jobId);
  console.log("🎬 Service:", isDemo ? "Demo" : "Replicate AI");

  try {
    await supabase
      .from("video_jobs")
      .update({ status: "processing", progress: 0 })
      .eq("id", jobId);

    const onProgress = async (progress: number) => {
      await supabase
        .from("video_jobs")
        .update({ progress })
        .eq("id", jobId);
    };

    const result = await videoService.generate(jobId, payload, onProgress);

    await supabase
      .from("video_jobs")
      .update({
        status: "completed",
        progress: 100,
        video_url: result.videoUrl,
        thumbnail_url: result.thumbnailUrl,
        is_demo: result.isDemo,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    console.log("✅ Job completed:", jobId);

  } catch (error) {
    console.error("❌ Job failed:", jobId, error);
    await supabase
      .from("video_jobs")
      .update({
        status: "failed",
        error_message: error.message || "Generation failed",
      })
      .eq("id", jobId);
  }
}

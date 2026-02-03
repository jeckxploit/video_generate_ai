import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface VideoJobPayload {
  sessionId: string;
  videoType: string;
  style: string;
  duration: string;
  format: string;
  userPrompt: string;
  generatedPrompt: string;
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
  // Sample video URLs for different scenarios
  private readonly sampleVideos = [
    "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  ];

  private readonly sampleThumbnails = [
    "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=640&h=360&fit=crop",
    "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=640&h=360&fit=crop",
    "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=640&h=360&fit=crop",
    "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=640&h=360&fit=crop",
  ];

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

    // Select sample video based on video type for variety
    const typeIndex = ['promotional', 'explainer', 'social', 'presentation', 'story', 'tutorial']
      .indexOf(payload.videoType);
    const videoIndex = typeIndex >= 0 ? typeIndex % this.sampleVideos.length : 0;

    return {
      videoUrl: this.sampleVideos[videoIndex],
      thumbnailUrl: this.sampleThumbnails[videoIndex],
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
      const payload: VideoJobPayload = await req.json();
      console.log("[API] Received job submission:", payload.userPrompt.slice(0, 50) + "...");

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
        console.error("[API] Error creating job:", insertError);
        throw insertError;
      }

      console.log("[API] Job created:", job.id);

      // Start background processing
      processVideoJob(supabase, job.id, payload).catch((err) => {
        console.error("[API] Background processing error:", err);
      });

      return new Response(
        JSON.stringify({
          success: true,
          jobId: job.id,
          message: "Video generation started",
          isDemo: true, // Indicate this is demo mode
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

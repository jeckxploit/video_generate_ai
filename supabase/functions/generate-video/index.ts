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

// Simulate video generation progress updates
async function processVideoJob(supabase: any, jobId: string) {
  console.log(`Starting video generation for job: ${jobId}`);
  
  const progressSteps = [
    { progress: 10, delay: 1000 },
    { progress: 25, delay: 1500 },
    { progress: 40, delay: 2000 },
    { progress: 60, delay: 2000 },
    { progress: 80, delay: 1500 },
    { progress: 95, delay: 1000 },
  ];

  // Update status to processing
  await supabase
    .from("video_jobs")
    .update({ status: "processing", progress: 5 })
    .eq("id", jobId);

  console.log(`Job ${jobId} status updated to processing`);

  // Simulate progress updates
  for (const step of progressSteps) {
    await new Promise((resolve) => setTimeout(resolve, step.delay));
    
    const { error } = await supabase
      .from("video_jobs")
      .update({ progress: step.progress })
      .eq("id", jobId);
    
    if (error) {
      console.error(`Error updating progress for job ${jobId}:`, error);
    } else {
      console.log(`Job ${jobId} progress: ${step.progress}%`);
    }
  }

  // Generate a sample video URL (in production, this would be the actual generated video)
  const sampleVideoUrl = "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4";
  const thumbnailUrl = "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400&h=225&fit=crop";

  // Mark job as completed
  const { error: completeError } = await supabase
    .from("video_jobs")
    .update({
      status: "completed",
      progress: 100,
      video_url: sampleVideoUrl,
      thumbnail_url: thumbnailUrl,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (completeError) {
    console.error(`Error completing job ${jobId}:`, completeError);
    throw completeError;
  }

  console.log(`Job ${jobId} completed successfully`);
  return { videoUrl: sampleVideoUrl, thumbnailUrl };
}

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

    if (req.method === "POST" && action === "submit") {
      // Submit new video generation job
      const payload: VideoJobPayload = await req.json();
      console.log("Received job submission:", payload);

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
        console.error("Error creating job:", insertError);
        throw insertError;
      }

      console.log("Job created:", job.id);

      // Start background processing (fire and forget)
      processVideoJob(supabase, job.id).catch((err) => {
        console.error("Background processing error:", err);
        supabase
          .from("video_jobs")
          .update({ status: "failed", error_message: err.message })
          .eq("id", job.id);
      });

      return new Response(
        JSON.stringify({
          success: true,
          jobId: job.id,
          message: "Video generation started",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (req.method === "GET" && action === "status") {
      // Get job status
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
        console.error("Error fetching job:", fetchError);
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

      return new Response(JSON.stringify(job), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Invalid action or method" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Edge function error:", error);
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

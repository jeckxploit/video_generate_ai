import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WizardData } from '@/types/wizard';
import { generateAutoPrompt } from '@/lib/promptGenerator';
import { toast } from 'sonner';

export type JobStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'failed';

export interface VideoJob {
  id: string;
  status: JobStatus;
  progress: number;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  errorMessage: string | null;
}

// Generate a unique session ID for this browser session
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('video_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('video_session_id', sessionId);
  }
  return sessionId;
};

export const useVideoGeneration = () => {
  const [job, setJob] = useState<VideoJob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Poll for job status updates
  useEffect(() => {
    if (!job || job.status === 'completed' || job.status === 'failed' || job.status === 'idle') {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const jobIdParam = job.id;
        
        console.log('[VideoGen] Polling status for job:', jobIdParam);
        
        // Use direct fetch for GET with query params
        const response = await fetch(
          `${supabaseUrl}/functions/v1/generate-video?action=status&jobId=${jobIdParam}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('[VideoGen] Poll response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[VideoGen] Poll error:', response.status, errorText);
          throw new Error(`Failed to fetch job status: ${response.status}`);
        }

        const jobData = await response.json();
        console.log('[VideoGen] Job data received:', jobData);

        setJob({
          id: jobData.id,
          status: jobData.status as JobStatus,
          progress: jobData.progress || 0,
          videoUrl: jobData.video_url,
          thumbnailUrl: jobData.thumbnail_url,
          errorMessage: jobData.error_message,
        });

        if (jobData.status === 'completed') {
          toast.success('Video berhasil dibuat!', {
            description: 'Klik tombol download untuk menyimpan video Anda.',
          });
        } else if (jobData.status === 'failed') {
          toast.error('Gagal membuat video', {
            description: jobData.error_message || 'Terjadi kesalahan saat membuat video.',
          });
        }
      } catch (error) {
        console.error('[VideoGen] Error polling job status:', error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [job?.id, job?.status]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!job?.id) return;

    const channel = supabase
      .channel(`video_job_${job.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'video_jobs',
          filter: `id=eq.${job.id}`,
        },
        (payload) => {
          console.log('[VideoGen] Realtime update received:', payload);
          const data = payload.new as any;
          setJob({
            id: data.id,
            status: data.status as JobStatus,
            progress: data.progress || 0,
            videoUrl: data.video_url,
            thumbnailUrl: data.thumbnail_url,
            errorMessage: data.error_message,
          });

          if (data.status === 'completed') {
            toast.success('Video berhasil dibuat!', {
              description: 'Klik tombol download untuk menyimpan video Anda.',
            });
          } else if (data.status === 'failed') {
            toast.error('Gagal membuat video', {
              description: data.error_message || 'Terjadi kesalahan saat membuat video.',
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('[VideoGen] Realtime subscription status:', status);
      });

    return () => {
      console.log('[VideoGen] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [job?.id]);

  const submitJob = useCallback(async (data: WizardData) => {
    setIsSubmitting(true);
    console.log('[VideoGen] Starting job submission with data:', {
      videoType: data.videoType,
      style: data.style,
      duration: data.duration,
      format: data.format,
      promptLength: data.prompt?.length,
    });

    try {
      const { prompt: generatedPrompt } = generateAutoPrompt(data);
      const sessionId = getSessionId();
      
      console.log('[VideoGen] Generated prompt:', generatedPrompt?.slice(0, 100) + '...');
      console.log('[VideoGen] Session ID:', sessionId);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const submitUrl = `${supabaseUrl}/functions/v1/generate-video?action=submit`;
      
      console.log('[VideoGen] Submitting to URL:', submitUrl);

      const requestBody = {
        sessionId,
        videoType: data.videoType,
        style: data.style,
        duration: data.duration,
        format: data.format,
        userPrompt: data.prompt,
        generatedPrompt,
      };
      
      console.log('[VideoGen] Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(submitUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[VideoGen] Response status:', response.status);

      if (!response.ok) {
        // Try to get error details
        let errorData;
        const errorText = await response.text();
        console.error('[VideoGen] Error response text:', errorText);
        
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP ${response.status}` };
        }
        
        console.error('[VideoGen] Error response:', errorData);
        
        // Extract user-friendly message
        const errorMessage = errorData.error?.message || 
                            errorData.error || 
                            errorData.message ||
                            `Failed to submit job: ${response.status}`;
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('[VideoGen] Success response:', result);

      setJob({
        id: result.jobId,
        status: 'pending',
        progress: 0,
        videoUrl: null,
        thumbnailUrl: null,
        errorMessage: null,
      });

      toast.info('Video sedang diproses...', {
        description: 'Proses ini membutuhkan waktu 30-60 detik.',
      });

      return result.jobId;
    } catch (error) {
      console.error('[VideoGen] Error submitting job:', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan.';
      toast.error('Gagal memulai generasi video', {
        description: errorMessage,
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const resetJob = useCallback(() => {
    setJob(null);
  }, []);

  return {
    job,
    isSubmitting,
    submitJob,
    resetJob,
  };
};

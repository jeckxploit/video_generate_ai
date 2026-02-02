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
        // Use direct fetch for GET with query params
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-video?action=status&jobId=${job.id}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch job status');
        }

        const jobData = await response.json();
        
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
        console.error('Error polling job status:', error);
      }
    }, 1500);

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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [job?.id]);

  const submitJob = useCallback(async (data: WizardData) => {
    setIsSubmitting(true);
    
    try {
      const { prompt: generatedPrompt } = generateAutoPrompt(data);
      const sessionId = getSessionId();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-video?action=submit`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            videoType: data.videoType,
            style: data.style,
            duration: data.duration,
            format: data.format,
            userPrompt: data.prompt,
            generatedPrompt,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit job');
      }

      const result = await response.json();
      
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
      console.error('Error submitting job:', error);
      toast.error('Gagal memulai generasi video', {
        description: error instanceof Error ? error.message : 'Terjadi kesalahan.',
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

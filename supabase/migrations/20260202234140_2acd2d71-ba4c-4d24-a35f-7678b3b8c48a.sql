-- Create video_jobs table for async video generation
CREATE TABLE public.video_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  video_type TEXT NOT NULL,
  style TEXT NOT NULL,
  duration TEXT NOT NULL,
  format TEXT NOT NULL,
  user_prompt TEXT NOT NULL,
  generated_prompt TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  error_message TEXT,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.video_jobs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create jobs (no auth required for demo)
CREATE POLICY "Anyone can create video jobs"
ON public.video_jobs
FOR INSERT
WITH CHECK (true);

-- Allow anyone to view their own jobs by session_id
CREATE POLICY "Anyone can view their own jobs"
ON public.video_jobs
FOR SELECT
USING (true);

-- Allow updates from backend (service role)
CREATE POLICY "Service role can update jobs"
ON public.video_jobs
FOR UPDATE
USING (true);

-- Enable realtime for job status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_jobs;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_video_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_video_jobs_updated_at
BEFORE UPDATE ON public.video_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_video_jobs_updated_at();
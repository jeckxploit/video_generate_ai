-- Create api_keys table for storing third-party API credentials
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_name TEXT NOT NULL UNIQUE,
  key_value TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Only service role can access API keys
CREATE POLICY "Service role can read API keys"
ON public.api_keys
FOR SELECT
USING (true);

CREATE POLICY "Service role can manage API keys"
ON public.api_keys
FOR ALL
USING (true);

-- Insert Replicate API key (update the value below with your actual key)
INSERT INTO public.api_keys (key_name, key_value, description, is_active)
VALUES (
  'REPLICATE_API_TOKEN',
  'YOUR_REPLICATE_API_TOKEN_HERE',
  'Replicate API token for AI video generation',
  true
)
ON CONFLICT (key_name) DO UPDATE
SET 
  key_value = EXCLUDED.key_value,
  updated_at = now();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_api_keys_updated_at
BEFORE UPDATE ON public.api_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_api_keys_updated_at();

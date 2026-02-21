# 🚀 Quick Setup - AI Video Generator

## Cara Mudah Setup API Key (Via SQL Editor)

Karena project ini dibuat dengan Lovable, cara termudah untuk setup API key adalah melalui **SQL Editor** di Supabase Dashboard.

### Langkah 1: Buka SQL Editor

1. Kunjungi: **https://supabase.com/dashboard/project/jmqmirgxotxcdxyhkpun/sql**
2. Atau dari Dashboard, klik **"SQL Editor"** di sidebar kiri

### Langkah 2: Jalankan SQL Script

Copy dan paste SQL berikut ke SQL Editor, lalu klik **"Run"**:

```sql
-- Create api_keys table if not exists
CREATE TABLE IF NOT EXISTS public.api_keys (
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can read API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Service role can manage API keys" ON public.api_keys;

-- Create policies
CREATE POLICY "Service role can read API keys"
ON public.api_keys FOR SELECT
USING (true);

CREATE POLICY "Service role can manage API keys"
ON public.api_keys FOR ALL
USING (true);

-- Insert or update Replicate API key
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
  updated_at = now(),
  is_active = true;
```

### Langkah 3: Verifikasi

Jalankan query ini untuk memastikan API key tersimpan:

```sql
SELECT key_name, description, is_active, created_at 
FROM public.api_keys 
WHERE key_name = 'REPLICATE_API_TOKEN';
```

Anda harus melihat hasil dengan `is_active = true`.

### Langkah 4: Test

1. Buka aplikasi: **http://localhost:8080**
2. Buat konfigurasi video
3. Klik **"Generate Video dengan AI"**
4. Video akan dibuat menggunakan Replicate API!

---

## 🎉 Selesai!

Sekarang aplikasi Anda akan menggunakan Replicate API untuk membuat video yang sebenarnya.

### Troubleshooting

**Video masih demo?**
- Check console log di browser
- Pastikan SQL script berhasil dijalankan tanpa error
- Refresh halaman dan coba lagi

**Error di Edge Function?**
- Buka **Supabase Dashboard** → **Edge Functions** → **generate-video**
- Klik **"Logs"** untuk melihat error detail

**Butuh bantuan?**
- Lihat log di browser console (F12)
- Check Edge Function logs di Supabase Dashboard

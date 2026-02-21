# 🐛 Debug PWA Video Generation Issue

## Solusi untuk "Gagal Memulai Generate Video" di Android PWA

### ✅ Langkah Cepat Debug

#### 1. **Buka Debug Console di PWA**
- Buka aplikasi PWA di Android
- Klik icon 🐛 (bug) di pojok kanan bawah
- Lihat console logs saat klik "Generate Video"

#### 2. **Check Error Message**
Cari error dengan pattern ini:
- `[VideoGen] Error submitting job:` - Error saat submit
- `[VideoGen] Response status: 4xx/5xx` - HTTP error
- `[VideoGen] Poll error:` - Error saat polling status

#### 3. **Common Fixes**

---

### 🔴 Error: "Failed to fetch" atau Network Error

**Penyebab:**
- Edge Function URL salah
- CORS issue
- Internet connection masalah

**Solusi:**
```bash
# 1. Verify Edge Function deployed
npx supabase functions list --project-ref jmqmirgxotxcdxyhkpun

# 2. Redeploy jika perlu
npx supabase functions deploy generate-video --project-ref jmqmirgxotxcdxyhkpun

# 3. Check logs
npx supabase functions logs generate-video --project-ref jmqmirgxotxcdxyhkpun
```

---

### 🔴 Error: 401 Unauthorized

**Penyebab:**
- Supabase anon key salah/expired
- API key tidak valid

**Solusi:**
1. Buka Supabase Dashboard: https://app.supabase.com/project/jmqmirgxotxcdxyhkpun
2. Go to Settings > API
3. Copy "anon public" key
4. Update `.env`:
```env
VITE_SUPABASE_PUBLISHABLE_KEY="your-new-anon-key"
```
5. Rebuild: `npm run build`

---

### 🔴 Error: 404 Not Found

**Penyebab:**
- Edge Function tidak ada
- URL function salah

**Solusi:**
```bash
# Check function exists
npx supabase functions list --project-ref jmqmirgxotxcdxyhkpun

# Deploy function
npx supabase functions deploy generate-video --project-ref jmqmirgxotxcdxyhkpun
```

---

### 🔴 Error: 500 Internal Server Error

**Penyebab:**
- Replicate API key invalid/missing
- Database error
- Edge Function bug

**Solusi:**
```bash
# 1. Check secrets
npx supabase secrets list --project-ref jmqmirgxotxcdxyhkpun

# 2. Set Replicate API token jika belum
npx supabase secrets set REPLICATE_API_TOKEN="r8_your_token_here" --project-ref jmqmirgxotxcdxyhkpun

# 3. Check database table
# Buka Supabase SQL Editor dan run:
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'video_jobs'
) as table_exists;
```

---

### 🔴 Error: "Session ID undefined"

**Penyebab:**
- sessionStorage tidak tersedia di PWA standalone mode

**Solusi:**
Update `src/hooks/useVideoGeneration.ts`, ganti `getSessionId()` dengan:
```typescript
const getSessionId = () => {
  // Try sessionStorage first
  let sessionId = sessionStorage.getItem('video_session_id');
  if (!sessionId) {
    // Fallback to localStorage if sessionStorage fails
    sessionId = localStorage.getItem('video_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      try {
        sessionStorage.setItem('video_session_id', sessionId);
      } catch {
        localStorage.setItem('video_session_id', sessionId);
      }
    }
  }
  return sessionId;
};
```

---

### 🔴 Error: Timeout/Request Takes Too Long

**Penyebab:**
- Replicate API lambat
- Network latency di mobile

**Solusi:**
1. Increase timeout di Edge Function (supabase/functions/generate-video/index.ts):
```typescript
const GENERATION_TIMEOUT = 300000; // 5 minutes (from 3)
```

2. Use demo mode untuk testing (no API key needed)

---

### 📱 Test di Android PWA

#### Langkah Test:
1. **Build & Deploy**
```bash
npm run build
npx supabase functions deploy generate-video --project-ref jmqmirgxotxcdxyhkpun
```

2. **Host Production Build**
```bash
# Test locally dengan preview
npm run preview

# Atau deploy ke hosting (Vercel, Netlify, dll)
```

3. **Add to Home Screen**
- Buka di Chrome Android
- Tap menu (⋮) > "Add to Home screen"
- Buka dari home screen

4. **Debug**
- Tap 🐛 icon di app
- Generate video
- Check console logs

---

### 🔍 Manual Test Request

Test Edge Function langsung dengan curl:

```bash
# Test submit job
curl -X POST "https://jmqmirgxotxcdxyhkpun.supabase.co/functions/v1/generate-video?action=submit" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-123",
    "videoType": "promotional",
    "style": "modern",
    "duration": "short",
    "format": "landscape",
    "userPrompt": "Test video generation from curl",
    "generatedPrompt": "Test promotional video"
  }'

# Test check status
curl "https://jmqmirgxotxcdxyhkpun.supabase.co/functions/v1/generate-video?action=status&jobId=JOB_ID_FROM_RESPONSE" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

### 📊 Database Check

```sql
-- Check recent jobs
SELECT 
  id, 
  status, 
  progress, 
  user_prompt,
  created_at 
FROM public.video_jobs 
ORDER BY created_at DESC 
LIMIT 10;

-- Check failed jobs
SELECT 
  id, 
  error_message,
  created_at 
FROM public.video_jobs 
WHERE status = 'failed'
ORDER BY created_at DESC 
LIMIT 5;

-- Check if realtime enabled
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

---

### 🛠️ Quick Fix Script

Simpan sebagai `fix-pwa.sh`:

```bash
#!/bin/bash

echo "🔧 Fixing PWA Video Generation Issues..."

# 1. Redeploy Edge Function
echo "📦 Redeploying Edge Function..."
npx supabase functions deploy generate-video --project-ref jmqmirgxotxcdxyhkpun

# 2. Check secrets
echo "🔑 Checking secrets..."
npx supabase secrets list --project-ref jmqmirgxotxcdxyhkpun

# 3. Build frontend
echo "🏗️ Building frontend..."
npm run build

# 4. Test Edge Function
echo "🧪 Testing Edge Function..."
curl -X POST "https://jmqmirgxotxcdxyhkpun.supabase.co/functions/v1/generate-video?action=submit" \
  -H "Authorization: Bearer $VITE_SUPABASE_PUBLISHABLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-fix",
    "videoType": "promotional",
    "style": "modern",
    "duration": "short",
    "format": "landscape",
    "userPrompt": "Test after fix",
    "generatedPrompt": "Test"
  }'

echo "✅ Done! Check output above for errors."
```

---

### 📞 Need More Help?

Jika masih ada issue, provide:
1. Screenshot error dari debug console
2. Output dari `npx supabase functions logs generate-video`
3. Result dari database check query
4. Test curl response

---

**Last Updated:** 2026-02-21
**Version:** 1.0.0

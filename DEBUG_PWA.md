# Debug PWA Video Generation Issue

## Checklist untuk Debug Issue di Android PWA

### 1. Buka Developer Tools di Android
- Buka Chrome di desktop
- Navigate ke `chrome://inspect/#devices`
- Enable "Discover USB devices"
- Connect Android device via USB
- Inspect PWA dari list

### 2. Check Console Errors
Look for errors dengan prefix `[VideoGen]`

### 3. Common Issues & Solutions

#### Issue: "Failed to fetch"
**Cause:** CORS atau network error
**Solution:**
- Check internet connection
- Verify SUPABASE_URL di .env
- Check CORS headers di Edge Function

#### Issue: "Mixed Content" error
**Cause:** HTTPS page trying to load HTTP resource
**Solution:**
- Pastikan semua URL menggunakan HTTPS
- Check VITE_SUPABASE_URL di .env (harus HTTPS)

#### Issue: "Network request failed"
**Cause:** Android WebView network restrictions
**Solution:**
- Check internet permission di Android
- Try on different network (WiFi vs Mobile Data)

#### Issue: "Session ID undefined"
**Cause:** sessionStorage tidak tersedia
**Solution:**
- Check jika PWA running dalam standalone mode
- sessionStorage mungkin cleared saat app restart

### 4. Test Steps

1. **Open PWA di Android**
2. **Navigate ke wizard**
3. **Fill all steps**
4. **Click "Generate Video dengan AI"**
5. **Check console untuk log:**
   ```
   [VideoGen] Starting job submission with data: ...
   [VideoGen] Submitting to URL: https://...
   [VideoGen] Request body: {...}
   [VideoGen] Response status: 200/400/500
   ```

### 5. Expected Flow

1. User clicks Generate button
2. Frontend sends POST to Edge Function
3. Edge Function creates job in database
4. Edge Function returns jobId
5. Frontend polls for status every 2 seconds
6. Edge Function processes video (Replicate API or Demo)
7. Frontend receives completed status
8. Video displayed to user

### 6. Environment Variables Required

```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_PROJECT_ID="your-project-id"
```

### 7. Supabase Edge Function Secrets

```bash
supabase secrets set REPLICATE_API_TOKEN="r8_your_token"
```

### 8. Database Check

Run di Supabase SQL Editor:
```sql
-- Check if video_jobs table exists
SELECT * FROM public.video_jobs LIMIT 5;

-- Check recent jobs
SELECT id, status, progress, created_at 
FROM public.video_jobs 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if realtime is enabled
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

### 9. Edge Function Logs

View logs di:
- Supabase Dashboard > Edge Functions > generate-video > Logs
- Or via CLI: `supabase functions logs generate-video`

### 10. Quick Fix Commands

```bash
# Redeploy Edge Function
npx supabase functions deploy generate-video --project-ref jmqmirgxotxcdxyhkpun

# Check function secrets
npx supabase secrets list --project-ref jmqmirgxotxcdxyhkpun

# Verify database schema
npx supabase db pull --project-ref jmqmirgxotxcdxyhkpun
```

## Error Codes Reference

| Code | Meaning | Solution |
|------|---------|----------|
| VALIDATION_ERROR | Invalid input data | Check form data |
| INVALID_PROMPT | Prompt too short/long | Min 10, Max 2000 chars |
| RATE_LIMIT | Too many requests | Wait 60 seconds |
| API_TIMEOUT | Request timeout | Wait 30 seconds |
| API_FAILURE | Replicate API error | Check API key |
| SERVICE_UNAVAILABLE | Service down | Wait 5 minutes |
| INTERNAL_ERROR | System error | Contact support |

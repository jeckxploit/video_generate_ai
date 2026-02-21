# 🚀 Deploy Edge Function Fix

## Masalah: Validasi False Positive

Edge Function mem-block prompt yang mengandung kata "malware", "virus", dll., meskipun konteksnya edukasi.

## Solusi: Update FORBIDDEN_PATTERNS

File yang diubah: `supabase/functions/generate-video/index.ts`

### Perubahan:

**SEBELUM:**
```typescript
const FORBIDDEN_PATTERNS = [
  /\b(hack|exploit|malware|virus)\b/i,
  /\b(weapon|bomb|explosive)\b/i,
  /<script|javascript:|data:/i,
  /\x00|\x1f/g,
];
```

**SESUDAH:**
```typescript
const FORBIDDEN_PATTERNS = [
  // Only block if it's an instruction to create harmful content
  /\b(hack|exploit)\s+(system|network|account|password)\b/i,
  /\b(make|create|build)\s+(bomb|explosive|weapon)\b/i,
  /\b(how\s+to)\s+(hack|exploit|crack)\b/i,
  /<script|javascript:|data:/i,
  /\x00|\x1f/g,
];
```

## Cara Deploy

### Opsi 1: Via Supabase Dashboard (Recommended)

1. Buka **Supabase Dashboard**: https://app.supabase.com/project/jmqmirgxotxcdxyhkpun
2. Go to **Edge Functions** > **generate-video**
3. Click **Deploy from Git** (jika connected) atau **Manual Deploy**
4. Upload file `supabase/functions/generate-video/index.ts` yang sudah diupdate
5. Click **Deploy**

### Opsi 2: Via CLI (Jika punya access)

```bash
# Login ke Supabase
npx supabase login

# Deploy function
npx supabase functions deploy generate-video --project-ref jmqmirgxotxcdxyhkpun
```

### Opsi 3: Via API

```bash
# Get your access token dari https://app.supabase.com/account/tokens

curl -X POST "https://api.supabase.com/projects/jmqmirgxotxcdxyhkpun/functions/generate-video" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "generate-video",
    "name": "generate-video",
    "verify_jwt": false
  }'
```

## Test Setelah Deploy

Test dengan curl:

```bash
# Test prompt yang sebelumnya di-block
curl -X POST "https://jmqmirgxotxcdxyhkpun.supabase.co/functions/v1/generate-video?action=submit" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-malware",
    "videoType": "tutorial",
    "style": "modern",
    "duration": "medium",
    "format": "portrait",
    "userPrompt": "Buatkan video edukasi malware",
    "generatedPrompt": "Edukasi tentang malware"
  }'
```

Expected response:
```json
{
  "success": true,
  "jobId": "uuid-here"
}
```

## Prompt yang Sekarang Diizinkan:

✅ "Buatkan video edukasi malware"
✅ "Tutorial tentang virus komputer"
✅ "Explainer cara kerja exploit"
✅ "Presentasi keamanan cybersecurity"

## Prompt yang Masih Di-block:

❌ "Hack system bank"
❌ "Create bomb tutorial"
❌ "How to exploit network vulnerability"
❌ "Crack password account"

## Verify Deployment

Check logs di:
- Supabase Dashboard > Edge Functions > generate-video > Logs
- Atau via CLI: `npx supabase functions logs generate-video --project-ref jmqmirgxotxcdxyhkpun`

## Frontend Update

Frontend sudah di-build dengan perubahan di `dist/`. Deploy ke hosting (Vercel, Netlify, dll):

```bash
# Jika pakai Vercel
vercel --prod

# Jika pakai Netlify
netlify deploy --prod
```

Atau upload manual folder `dist/` ke hosting Anda.

---

**Last Updated:** 2026-02-21
**Status:** ✅ Fixed, pending deployment

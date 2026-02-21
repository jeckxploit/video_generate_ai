# 🔑 SETUP REPLICATE API - PANDUAN LENGKAP

## ⚠️ MASALAH: Video Hanya Menampilkan Demo/Placeholder

Jika video yang digenerate adalah **placeholder/demo** (video random dari Tears of Steel, Sintel, dll), artinya **Replicate API key belum di-set** dengan benar.

---

## ✅ SOLUSI: Setup Replicate API Key

### Langkah 1: Dapatkan Replicate API Token

1. **Buka**: https://replicate.com/account/api-tokens
2. **Login/Signup** akun Replicate (gratis dengan $5 credit)
3. **Copy** API token (dimulai dengan `r8_`)

![Get API Token](https://replicate.com/static/api-token-example.png)

---

### Langkah 2: Set API Token di Supabase

#### Opsi A: Via Supabase CLI (Recommended)

```bash
# Install Supabase CLI jika belum
npm install -g supabase

# Login ke Supabase
npx supabase login

# Set secret dengan API token Anda
npx supabase secrets set REPLICATE_API_TOKEN="r8_YOUR_ACTUAL_TOKEN_HERE" --project-ref jmqmirgxotxcdxyhkpun

# Verify secret ter-set
npx supabase secrets list --project-ref jmqmirgxotxcdxyhkpun
```

#### Opsi B: Via Supabase Dashboard

1. **Buka**: https://app.supabase.com/project/jmqmirgxotxcdxyhkpun
2. **Navigate**: Edge Functions > Manage Secrets
3. **Add Secret**:
   - Name: `REPLICATE_API_TOKEN`
   - Value: `r8_YOUR_ACTUAL_TOKEN_HERE`
4. **Click**: Save

---

### Langkah 3: Deploy Ulang Edge Function

```bash
# Deploy function dengan secret yang baru
npx supabase functions deploy generate-video --project-ref jmqmirgxotxcdxyhkpun
```

---

### Langkah 4: Test

```bash
# Test dengan curl
curl -X POST "https://jmqmirgxotxcdxyhkpun.supabase.co/functions/v1/generate-video?action=submit" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-api-key",
    "videoType": "tutorial",
    "style": "modern",
    "duration": "short",
    "format": "landscape",
    "userPrompt": "Test video dengan AI",
    "generatedPrompt": "Test"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "jobId": "uuid-here"
}
```

---

## 🔍 Verifikasi Setup

### Check Logs

```bash
# Lihat logs Edge Function
npx supabase functions logs generate-video --project-ref jmqmirgxotxcdxyhkpun
```

**Look for:**
```
[Factory] ✅ Using API key from environment variable
[Factory] ✅ Using Replicate AI Video Service
[ReplicateService] Starting video generation for job: ...
[ReplicateService] Submitting prediction to Replicate...
```

**BUKAN:**
```
[Factory] ❌ No valid Replicate API key found
[Factory] ⚠️ FALLING BACK TO DEMO SERVICE
```

---

## 💰 Replicate Pricing

### Free Tier:
- **$5 credit** saat signup (cukup untuk ~250 video pendek)
- Pay-as-you-go setelah credit habis

### Cost per Video (Zeroscope v2 XL):
- **4 detik**: ~$0.02
- **8 detik**: ~$0.04
- **16 detik**: ~$0.08

### Subscription:
- **Pro Plan**: $9/month (lebih murah untuk high volume)

---

## 🚨 Troubleshooting

### Error: "Invalid API token"

**Penyebab:** Token salah atau expired

**Solusi:**
1. Regenerate token di https://replicate.com/account/api-tokens
2. Update secret dengan token baru
3. Redeploy function

### Error: "Rate limit exceeded"

**Penyebab:** Terlalu banyak request dalam waktu singkat

**Solusi:**
1. Tunggu beberapa menit
2. Upgrade ke Pro plan jika perlu

### Error: "Insufficient credits"

**Penyebab:** Credit habis

**Solusi:**
1. Add payment method di Replicate
2. Purchase more credits

### Masih Demo Mode setelah set secret

**Penyebab:** Secret tidak terbaca atau function belum redeploy

**Solusi:**
```bash
# 1. Verify secret ter-set
npx supabase secrets list --project-ref jmqmirgxotxcdxyhkpun

# 2. Redeploy function
npx supabase functions deploy generate-video --project-ref jmqmirgxotxcdxyhkpun

# 3. Check logs
npx supabase functions logs generate-video --project-ref jmqmirgxotxcdxyhkpun
```

---

## 📊 Monitoring Usage

### Check Replicate Usage:
1. Login ke https://replicate.com
2. Go to **Account** > **Billing**
3. Lihat **Usage** dan **Credits remaining**

### Check Supabase Function Usage:
1. Login ke https://app.supabase.com
2. Go to **Project** > **Edge Functions**
3. Lihat **Invocations** dan **Errors**

---

## 🎯 Expected Behavior After Setup

### SEBELUM (Demo Mode):
```
[Factory] ❌ No valid Replicate API key found
[Factory] ⚠️ FALLING BACK TO DEMO SERVICE
```
**Hasil:** Video placeholder random (Tears of Steel, Sintel, dll)

---

### SESUDAH (AI Mode):
```
[Factory] ✅ Using API key from environment variable
[Factory] ✅ Using Replicate AI Video Service
[ReplicateService] Starting video generation for job: xxx
[ReplicateService] Submitting prediction to Replicate...
[ReplicateService] Prediction created: xxx
[ReplicateService] Status: processing, Progress: 50%
[ReplicateService] Generation succeeded!
[ReplicateService] Video URL: https://...
```
**Hasil:** Video AI yang digenerate sesuai prompt!

---

## 📝 Contoh Prompt yang Bagus

### ✅ Promotional:
```
Video promosi untuk coffee shop "Kopi Senja", tampilkan:
- Barista membuat kopi dengan latte art
- Suasana cozy cafe dengan pelanggan
- Close-up berbagai varian kopi
- Teks promo "Diskon 20% Weekend Special"
Durasi 15 detik, format landscape untuk YouTube
```

### ✅ Tutorial:
```
Tutorial step-by-step membuat website portfolio:
1. Instalasi Node.js dan npm
2. Create React App
3. Coding komponen Header, About, Projects
4. Styling dengan Tailwind CSS
5. Deploy ke Vercel
Tampilkan screen recording dengan highlight pada kode penting
```

### ✅ Explainer:
```
Video penjelasan tentang blockchain:
- Animasi diagram blok yang terhubung
- Ilustrasi transaksi peer-to-peer
- Visualisasi mining process
- Wallet dan private key
Gaya animasi modern dengan warna biru tech
```

---

## 🔗 Links Penting

- **Replicate Dashboard**: https://replicate.com
- **Replicate API Tokens**: https://replicate.com/account/api-tokens
- **Replicate Docs**: https://replicate.com/docs
- **Zeroscope Model**: https://replicate.com/lucataco/zeroscope-v2-xl
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Project Dashboard**: https://app.supabase.com/project/jmqmirgxotxcdxyhkpun

---

## 💡 Tips

1. **Simpan API token dengan aman** - Jangan commit ke Git!
2. **Monitor usage** - Set budget alert di Replicate
3. **Test dengan prompt pendek dulu** - Hemat credit saat debugging
4. **Gunakan negative prompt** - Untuk hasil yang lebih baik
5. **Experiment dengan parameters** - guidance_scale, num_frames, dll

---

**Last Updated:** 2026-02-21  
**Status:** ✅ Ready to use after API key setup

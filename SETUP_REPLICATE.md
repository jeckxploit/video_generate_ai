# Setup Replicate API untuk AI Video Generation

Panduan ini akan membantu Anda mengintegrasikan Replicate API untuk membuat video AI yang sebenarnya.

## 📋 Langkah-langkah Setup

### 1. Dapatkan Replicate API Key

1. Kunjungi [https://replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)
2. Login atau buat akun Replicate (gratis untuk mencoba)
3. Klik **"Create API Token"** atau salin token yang sudah ada
4. Simpan token Anda (dimulai dengan `r8_...`)

### 2. Setup di Supabase

#### Opsi A: Menggunakan Supabase CLI (Recommended)

```bash
# Login ke Supabase
npx supabase login

# Link ke project Anda
npx supabase link --project-ref jmqmirgxotxcdxyhkpun

# Set secret untuk Edge Function
npx supabase secrets set REPLICATE_API_TOKEN="your_replicate_api_key_here"
```

#### Opsi B: Melalui Supabase Dashboard

1. Buka [Supabase Dashboard](https://supabase.com/dashboard/project/jmqmirgxotxcdxyhkpun)
2. Navigasi ke **Edge Functions** → **generate-video**
3. Klik **"Secrets"** atau **"Environment Variables"**
4. Tambahkan secret baru:
   - **Key**: `REPLICATE_API_TOKEN`
   - **Value**: `your_replicate_api_key_here` (ganti dengan API key Anda)
5. Klik **Save**

### 3. Deploy Edge Function

```bash
# Deploy fungsi ke Supabase
npx supabase functions deploy generate-video --project-ref jmqmirgxotxcdxyhkpun
```

### 4. Verifikasi Setup

Setelah deploy, test dengan:

```bash
curl -X GET "https://jmqmirgxotxcdxyhkpun.supabase.co/functions/v1/generate-video?action=status&jobId=test" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptcW1pcmd4b3R4Y2R4eWhrcHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNzQxMTYsImV4cCI6MjA4NTY1MDExNn0.wv0zqNNmcbFOmXjRSvKbvN2LSeZ-pxAv2c4D5fVTU_Y"
```

## 💰 Pricing

Replicate menawarkan:
- **Gratis**: 3 menit credit saat signup
- **Pay-as-you-go**: $0.0002 - $0.02 per detik generasi video
- **Subscription**: Mulai dari $5/bulan untuk credit lebih banyak

### Estimasi Biaya per Video

Dengan model Zeroscope v2 XL:
- Video 4 detik: ~$0.01 - $0.02
- Video 15 detik: ~$0.04 - $0.08

## 🎬 Model AI yang Digunakan

Project ini menggunakan **Zeroscope v2 XL** dari Replicate:
- **Model**: `lucataco/zeroscope-v2-xl`
- **Kemampuan**: Text-to-video generation
- **Output**: Video MP4 berkualitas tinggi
- **Durasi**: 4-5 detik per generasi

### Model Alternatif

Anda bisa mengganti model di `supabase/functions/generate-video/index.ts`:

```typescript
// Stable Video Diffusion
const modelVersion = "stability-ai/stable-video-diffusion:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea351df4979778f7e9332fd5ab";

// ModelScope
const modelVersion = "damo-vilab/modelscope-text-to-video-synthesis:9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351";
```

## 🔧 Troubleshooting

### Error: "Invalid API key"
- Pastikan API key dimulai dengan `r8_`
- Check bahwa secret sudah di-set dengan benar
- Restart Edge Function setelah update secret

### Error: "Rate limit exceeded"
- Replicate memiliki rate limit untuk akun gratis
- Upgrade ke paid plan atau tunggu beberapa menit

### Error: "Generation timeout"
- Video generation bisa memakan waktu 1-3 menit
- Timeout default adalah 180 detik
- Increase timeout di `processVideoJob` jika diperlukan

### Video tidak sesuai dengan prompt
- Pastikan prompt deskriptif dan dalam bahasa Inggris
- Gunakan detail spesifik tentang visual yang diinginkan
- Hindari prompt yang terlalu panjang (>200 karakter)

## 📝 Tips untuk Hasil Terbaik

1. **Prompt yang Jelas**: "A cat playing with a ball of yarn in a cozy living room"
2. **Sebutkan Style**: "cinematic lighting, 4k quality, detailed fur texture"
3. **Komposisi**: "close-up shot, shallow depth of field"
4. **Motion**: "slow motion, smooth camera movement"

### Contoh Prompt yang Baik

```
High quality promotional advertisement, modern clean aesthetic with minimalist design, 
featuring a sleek smartphone rotating on white pedestal, smooth motion, professional quality, 
detailed visuals, studio lighting, product showcase
```

## 🚀 Next Steps

Setelah setup selesai:
1. Restart development server: `npm run dev`
2. Buka http://localhost:8080
3. Buat video dengan konfigurasi Anda
4. Klik "Generate Video dengan AI"

Video yang dihasilkan sekarang akan benar-benar dibuat oleh AI berdasarkan prompt Anda!

## 📚 Resources

- [Replicate Documentation](https://replicate.com/docs)
- [Zeroscope Model Page](https://replicate.com/lucataco/zeroscope-v2-xl)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Replicate API Reference](https://replicate.com/docs/reference/http)

## 🆘 Butuh Bantuan?

- Check [Replicate Discord](https://discord.gg/replicate)
- [Supabase Community](https://github.com/supabase/supabase/discussions)
- Issue tracker di repository ini

# 🎬 AI Video Generator

Platform pembuatan video otomatis dengan AI. Buat video profesional hanya dengan beberapa klik!

## ✨ Fitur

- 🎯 6 Tipe Video: Promotional, Explainer, Social Media, Presentation, Storytelling, Tutorial
- 🎨 6 Gaya Visual: Modern, Cinematic, Playful, Corporate, Retro, Futuristic
- ⏱️ Durasi Fleksibel: 15 detik hingga 2 menit
- 📐 Multi Format: Landscape (16:9), Portrait (9:16), Square (1:1)
- 🤖 AI-Powered: Generasi video otomatis dengan Replicate API
- 🎵 Smart Prompt: AI akan membuat prompt optimal dari deskripsi Anda

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ dan npm
- Akun Supabase
- Akun Replicate (untuk AI video generation)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd Day-3

# Install dependencies
npm install

# Start development server
npm run dev
```

Server akan berjalan di **http://localhost:8080**

## 🎬 Setup AI Video Generation

Untuk mengaktifkan fitur pembuatan video AI yang sebenarnya:

### 1. Dapatkan Replicate API Key

1. Kunjungi [https://replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)
2. Login/buat akun Replicate
3. Salin API token Anda (dimulai dengan `r8_`)

### 2. Setup di Supabase

**Menggunakan CLI (Recommended):**

```bash
# Install Supabase CLI jika belum
npm install -g supabase

# Login ke Supabase
npx supabase login

# Set secret untuk Edge Function
npx supabase secrets set REPLICATE_API_TOKEN="your_replicate_api_key_here"

# Deploy Edge Function
npx supabase functions deploy generate-video --project-ref jmqmirgxotxcdxyhkpun
```

**Atau jalankan script setup:**

```bash
# Windows
.\setup-replicate.cmd

# Linux/Mac
chmod +x setup-replicate.sh
./setup-replicate.sh
```

### 3. Test

Setelah setup, video yang dibuat akan benar-benar digenerate oleh AI berdasarkan prompt Anda!

📖 Lihat [SETUP_REPLICATE.md](./SETUP_REPLICATE.md) untuk panduan lengkap.

## 💰 Pricing

**Replicate API:**
- Gratis: 3 menit credit saat signup
- Pay-as-you-go: ~$0.01-0.02 per video 4 detik
- Subscription: Mulai dari $5/bulan

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **UI:** shadcn-ui, Tailwind CSS, Framer Motion
- **Backend:** Supabase Edge Functions
- **AI:** Replicate API (Zeroscope v2 XL)
- **State:** React Query

## 📁 Project Structure

```
Day-3/
├── src/
│   ├── components/       # React components
│   │   ├── wizard/       # Wizard step components
│   │   ├── layout/       # Layout components
│   │   └── ui/           # shadcn-ui components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities & helpers
│   ├── pages/            # Page components
│   ├── types/            # TypeScript types
│   └── data/             # Static data
├── supabase/
│   └── functions/
│       └── generate-video/  # Edge Function untuk AI video
└── public/               # Static assets
```

## 📝 Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run lint         # Lint code
```

## 🔧 Configuration

### Environment Variables

Edit `.env`:

```env
VITE_SUPABASE_URL="https://jmqmirgxotxcdxyhkpun.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your_anon_key"
VITE_REPLICATE_API_KEY="your_replicate_api_key"
```

### Edge Function Secrets

```bash
# Set Replicate API token
supabase secrets set REPLICATE_API_TOKEN="r8_..."
```

## 🐛 Troubleshooting

**Video tidak sesuai prompt:**
- Pastikan API key sudah di-set dengan benar
- Gunakan prompt deskriptif dalam bahasa Inggris
- Check log di Supabase Dashboard

**Error "Rate limit exceeded":**
- Akun gratis memiliki limit request per menit
- Tunggu beberapa menit atau upgrade plan

**Deployment error:**
- Pastikan Supabase CLI sudah terinstall
- Check koneksi internet
- Verifikasi project ref benar

## 📚 Resources

- [Replicate Documentation](https://replicate.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Zeroscope Model](https://replicate.com/lucataco/zeroscope-v2-xl)

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a PR.

---

Made with ❤️ using [Lovable](https://lovable.dev)

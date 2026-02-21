#!/bin/bash
# Setup script untuk deploy Edge Function ke Supabase

echo "🚀 Setup Replicate API Integration"
echo "===================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "📦 Installing Supabase CLI..."
    npm install -g supabase
fi

# Login to Supabase
echo ""
echo "🔐 Login ke Supabase..."
echo "Buka browser dan login dengan akun Supabase Anda"
supabase login

# Link project
echo ""
echo "🔗 Linking project..."
supabase link --project-ref jmqmirgxotxcdxyhkpun

# Set Replicate API secret
echo ""
echo "🔑 Setting Replicate API Token..."
read -p "Masukkan Replicate API Token Anda (dimulai dengan r8_): " REPLICATE_TOKEN

if [ -z "$REPLICATE_TOKEN" ]; then
    echo "⚠️  Token tidak dimasukkan, menggunakan placeholder..."
    echo "Anda bisa set token nanti dengan: supabase secrets set REPLICATE_API_TOKEN='your_token'"
else
    supabase secrets set REPLICATE_API_TOKEN="$REPLICATE_TOKEN"
fi

# Deploy function
echo ""
echo "📤 Deploying Edge Function..."
supabase functions deploy generate-video --project-ref jmqmirgxotxcdxyhkpun

echo ""
echo "✅ Setup selesai!"
echo ""
echo "📝 Langkah selanjutnya:"
echo "1. Buka http://localhost:8080"
echo "2. Buat konfigurasi video"
echo "3. Klik 'Generate Video dengan AI'"
echo ""
echo "📖 Lihat SETUP_REPLICATE.md untuk informasi lebih lanjut"

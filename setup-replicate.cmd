@echo off
REM Setup script untuk deploy Edge Function ke Supabase (Windows)

echo 🚀 Setup Replicate API Integration
echo ====================================
echo.

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %errorlevel% neq 0 (
    echo 📦 Installing Supabase CLI...
    npm install -g supabase
)

REM Login to Supabase
echo.
echo 🔐 Login ke Supabase...
echo Buka browser dan login dengan akun Supabase Anda
supabase login

REM Link project
echo.
echo 🔗 Linking project...
supabase link --project-ref jmqmirgxotxcdxyhkpun

REM Set Replicate API secret
echo.
echo 🔑 Setting Replicate API Token...
set /p REPLICATE_TOKEN=Masukkan Replicate API Token Anda (dimulai dengan r8_): 

if "%REPLICATE_TOKEN%"=="" (
    echo ⚠️  Token tidak dimasukkan, menggunakan placeholder...
    echo Anda bisa set token nanti dengan: supabase secrets set REPLICATE_API_TOKEN=your_token
) else (
    supabase secrets set REPLICATE_API_TOKEN=%REPLICATE_TOKEN%
)

REM Deploy function
echo.
echo 📤 Deploying Edge Function...
supabase functions deploy generate-video --project-ref jmqmirgxotxcdxyhkpun

echo.
echo ✅ Setup selesai!
echo.
echo 📝 Langkah selanjutnya:
echo 1. Buka http://localhost:8080
echo 2. Buat konfigurasi video
echo 3. Klik 'Generate Video dengan AI'
echo.
echo 📖 Lihat SETUP_REPLICATE.md untuk informasi lebih lanjut
pause

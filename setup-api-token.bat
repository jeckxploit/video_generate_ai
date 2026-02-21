@echo off
echo ========================================
echo   Setup Replicate API Token
echo   Project: cnlruydvcdujvhwyfiyc
echo ========================================
echo.

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [!] Supabase CLI not found. Installing...
    npm install -g supabase
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install Supabase CLI
        echo Please install manually: npm install -g supabase
        pause
        exit /b 1
    )
)

echo [OK] Supabase CLI found
echo.

REM Login
echo [Step 1/3] Logging in to Supabase...
echo     A browser window will open for login
echo.
npx supabase login
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Login failed
    pause
    exit /b 1
)

echo [OK] Login successful
echo.

REM Set secret
echo [Step 2/3] Setting Replicate API token...
echo [INFO] Please enter your Replicate API token when prompted
echo [INFO] Get token from: https://replicate.com/account/api-tokens
set /p REPLICATE_TOKEN="Enter your Replicate API token (r8_...): "

if "%REPLICATE_TOKEN%"=="" (
    echo [ERROR] No token provided
    pause
    exit /b 1
)

npx supabase secrets set REPLICATE_API_TOKEN="%REPLICATE_TOKEN%" --project-ref cnlruydvcdujvhwyfiyc
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to set secret
    echo.
    echo MANUAL SETUP:
    echo 1. Open https://app.supabase.com/project/cnlruydvcdujvhwyfiyc/functions/secrets
    echo 2. Click "New Secret"
    echo 3. Name: REPLICATE_API_TOKEN
    echo 4. Value: [your token]
    echo 5. Click Save
    pause
    exit /b 1
)

echo [OK] API token set successfully
echo.

REM Deploy function
echo [Step 3/3] Deploying Edge Function...
npx supabase functions deploy generate-video --project-ref cnlruydvcdujvhwyfiyc
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to deploy function
    echo Please deploy manually:
    echo   npx supabase functions deploy generate-video --project-ref cnlruydvcdujvhwyfiyc
    pause
    exit /b 1
)

echo [OK] Function deployed successfully
echo.
echo ========================================
echo   SETUP COMPLETE! 
echo ========================================
echo.
echo Your app will now generate AI videos!
echo Test at: https://video-generate-ai-v01.vercel.app/
echo.
pause

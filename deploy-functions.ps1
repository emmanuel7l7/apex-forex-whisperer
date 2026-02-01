# Forex Trading Bot - Quick Setup Script
# Run this after you've set up the database and got your Finnhub API key

Write-Host "🚀 Forex Trading Bot - Quick Setup" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
Write-Host "Checking for Supabase CLI..." -ForegroundColor Yellow
$supabaseExists = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseExists) {
    Write-Host "❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host "Installing Supabase CLI via npm..." -ForegroundColor Yellow
    npm install -g supabase
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Supabase CLI" -ForegroundColor Red
        Write-Host "Please install manually: npm install -g supabase" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "✅ Supabase CLI found" -ForegroundColor Green
Write-Host ""

# Link to project
Write-Host "Linking to Supabase project..." -ForegroundColor Yellow
$projectRef = "gewrbyiwjairnhehssje"

supabase link --project-ref $projectRef

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to link project. You may need to login first:" -ForegroundColor Red
    Write-Host "   supabase login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Project linked" -ForegroundColor Green
Write-Host ""

# Ask about Finnhub API key
Write-Host "Have you set up your FINNHUB_API_KEY in Supabase Dashboard?" -ForegroundColor Yellow
Write-Host "Go to: Project Settings → Edge Functions → Environment Variables" -ForegroundColor Gray
$continue = Read-Host "Continue with deployment? (y/n)"

if ($continue -ne 'y') {
    Write-Host "⏸️  Setup paused. Set up your API key and run this script again." -ForegroundColor Yellow
    exit 0
}

# Deploy Edge Functions
Write-Host ""
Write-Host "Deploying Edge Functions..." -ForegroundColor Yellow
Write-Host ""

Write-Host "📦 Deploying fetch-forex-data..." -ForegroundColor Cyan
supabase functions deploy fetch-forex-data

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ fetch-forex-data deployed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ fetch-forex-data deployment failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "📦 Deploying ai-analysis..." -ForegroundColor Cyan
supabase functions deploy ai-analysis

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ ai-analysis deployed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ ai-analysis deployment failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Make sure you ran the SQL in setup-database.sql" -ForegroundColor White
Write-Host "2. Run: npm run dev" -ForegroundColor White
Write-Host "3. Your app should be working at http://localhost:5173" -ForegroundColor White
Write-Host ""

# Nx Cloud Setup Script for Windows PowerShell
# This script helps set up Nx Cloud for the iHub Angular workspace

Write-Host "🚀 Setting up Nx Cloud for iHub Angular..." -ForegroundColor Green

# Check if nx-cloud is installed
try {
    npx nx-cloud --version | Out-Null
    Write-Host "✅ nx-cloud is already installed" -ForegroundColor Green
} catch {
    Write-Host "📦 Installing nx-cloud..." -ForegroundColor Yellow
    npm install --save-dev nx-cloud
}

# Check if we're in a git repository
if (!(Test-Path ".git")) {
    Write-Host "⚠️  This is not a git repository. Initializing git..." -ForegroundColor Yellow
    git init
    git add .
    git commit -m "Initial commit - iHub Angular with Nx workspace"
}

Write-Host ""
Write-Host "🔗 To complete Nx Cloud setup:" -ForegroundColor Cyan
Write-Host "1. Create an account at https://cloud.nx.app" -ForegroundColor White
Write-Host "2. Create a new workspace or connect to an existing one" -ForegroundColor White
Write-Host "3. Copy your access token" -ForegroundColor White
Write-Host "4. Update nx.json with your access token:" -ForegroundColor White
Write-Host '   "nxCloudAccessToken": "YOUR_ACTUAL_ACCESS_TOKEN"' -ForegroundColor Gray
Write-Host ""
Write-Host "5. Push your repository to GitHub/GitLab/Bitbucket:" -ForegroundColor White
Write-Host "   git remote add origin YOUR_REPO_URL" -ForegroundColor Gray
Write-Host "   git push -u origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "6. Connect your repository in the Nx Cloud dashboard" -ForegroundColor White
Write-Host ""
Write-Host "🏃‍♂️ Quick commands:" -ForegroundColor Cyan
Write-Host "  npm run build        # Build with caching" -ForegroundColor White
Write-Host "  npm run test         # Test with caching" -ForegroundColor White
Write-Host "  npm run lint         # Lint with caching" -ForegroundColor White
Write-Host "  npx nx affected:build # Build only affected projects" -ForegroundColor White
Write-Host ""
Write-Host "✨ Nx Cloud is configured and ready!" -ForegroundColor Green
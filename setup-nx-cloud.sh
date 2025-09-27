#!/bin/bash

# Nx Cloud Setup Script
# This script helps set up Nx Cloud for the iHub Angular workspace

echo "🚀 Setting up Nx Cloud for iHub Angular..."

# Check if nx-cloud is installed
if ! command -v nx-cloud &> /dev/null; then
    echo "📦 Installing nx-cloud..."
    npm install --save-dev nx-cloud
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "⚠️  This is not a git repository. Initializing git..."
    git init
    git add .
    git commit -m "Initial commit - iHub Angular with Nx workspace"
fi

echo "🔗 To complete Nx Cloud setup:"
echo "1. Create an account at https://cloud.nx.app"
echo "2. Create a new workspace or connect to an existing one"
echo "3. Copy your access token"
echo "4. Update nx.json with your access token:"
echo '   "nxCloudAccessToken": "YOUR_ACTUAL_ACCESS_TOKEN"'
echo ""
echo "5. Push your repository to GitHub/GitLab/Bitbucket:"
echo "   git remote add origin YOUR_REPO_URL"
echo "   git push -u origin main"
echo ""
echo "6. Connect your repository in the Nx Cloud dashboard"
echo ""
echo "🏃‍♂️ Quick commands:"
echo "  npm run build        # Build with caching"
echo "  npm run test         # Test with caching"
echo "  npm run lint         # Lint with caching"
echo "  npx nx affected:build # Build only affected projects"
echo ""
echo "✨ Nx Cloud is configured and ready!"
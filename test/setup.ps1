# PowerShell setup script for Izumi test environment on Windows
# Run this script in PowerShell as Administrator if needed

Write-Host "🚀 Izumi Test Environment Setup (Windows)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check if Docker is installed and running
Write-Host "🔍 Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker is installed: $dockerVersion" -ForegroundColor Green
    
    # Check if Docker is running
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker is running" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "📖 Visit: https://docs.docker.com/desktop/install/windows/" -ForegroundColor Cyan
    exit 1
}

# Check Docker Compose
Write-Host "🔍 Checking Docker Compose..." -ForegroundColor Yellow
try {
    $composeVersion = docker-compose --version 2>$null
    if ($composeVersion) {
        Write-Host "✅ Docker Compose is available: $composeVersion" -ForegroundColor Green
    } else {
        $composeV2Version = docker compose version
        Write-Host "✅ Docker Compose v2 is available: $composeV2Version" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Docker Compose is not available" -ForegroundColor Red
    exit 1
}

# Create .env file if it doesn't exist
Write-Host "🔧 Setting up environment..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file from template" -ForegroundColor Green
    
    $setupEnv = Read-Host "Would you like to configure your OpenAI API key now? (y/n)"
    if ($setupEnv -eq "y" -or $setupEnv -eq "yes") {
        $apiKey = Read-Host "Enter your OpenAI API key"
        if ($apiKey.Trim()) {
            $envContent = Get-Content ".env" -Raw
            $envContent = $envContent -replace "your-openai-api-key-here", $apiKey.Trim()
            Set-Content ".env" $envContent
            Write-Host "✅ OpenAI API key configured" -ForegroundColor Green
        }
    }
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Install dependencies
$installDeps = Read-Host "Install Node.js dependencies? (y/n)"
if ($installDeps -eq "y" -or $installDeps -eq "yes") {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    }
}

# Start database
$startDB = Read-Host "Start PostgreSQL database? (y/n)"
if ($startDB -eq "y" -or $startDB -eq "yes") {
    Write-Host "🐘 Starting PostgreSQL database..." -ForegroundColor Yellow
    
    Write-Host "📥 Pulling PostgreSQL image (this may take a few minutes on first run)..." -ForegroundColor Cyan
    docker-compose pull
    
    Write-Host "🚀 Starting database container..." -ForegroundColor Cyan
    docker-compose up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
        
        $retries = 30
        do {
            Start-Sleep -Seconds 2
            $ready = docker-compose exec postgres pg_isready -U postgres -d izumi_test 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Database is ready!" -ForegroundColor Green
                break
            }
            Write-Host "." -NoNewline -ForegroundColor Yellow
            $retries--
        } while ($retries -gt 0)
        
        if ($retries -eq 0) {
            Write-Host "❌ Database failed to start within expected time" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Failed to start database" -ForegroundColor Red
    }
}

# Test setup
$testSetup = Read-Host "Test database connection? (y/n)"
if ($testSetup -eq "y" -or $testSetup -eq "yes") {
    Write-Host "🧪 Testing setup..." -ForegroundColor Yellow
    node db-test.js
}

Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Available commands:" -ForegroundColor Cyan
Write-Host "   • npm run test-db      # Test database connection" -ForegroundColor White
Write-Host "   • npm run basic-test   # Run basic Izumi test" -ForegroundColor White
Write-Host "   • npm run interactive  # Interactive query runner" -ForegroundColor White
Write-Host "   • npm run logs         # View database logs" -ForegroundColor White
Write-Host "   • npm run stop-db      # Stop database" -ForegroundColor White
Write-Host ""
Write-Host "💡 Make sure to add your OpenAI API key to the .env file!" -ForegroundColor Yellow

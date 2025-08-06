# Website Builder Template Setup Script
Write-Host " Setting up Website Builder Template..." -ForegroundColor Blue

# Create directories
Write-Host " Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path @(
    "src\components\atomic",
    "src\components\blocks", 
    "src\components\variations",
    "src\layouts",
    "src\pages\api",
    "src\data",
    "src\utils",
    "config",
    "scripts", 
    "public"
) -Force | Out-Null

Write-Host " Directories created successfully!" -ForegroundColor Green
Write-Host " Now you can copy the file contents from the generated files" -ForegroundColor Cyan

# List the structure
Write-Host " Project structure:" -ForegroundColor Yellow
tree /f

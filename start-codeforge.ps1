# Codeforge launcher for PowerShell
Set-Location -LiteralPath $PSScriptRoot

Write-Host "Starting Codeforge..." -ForegroundColor Green
Write-Host "Tip: Set `$env:OPENAI_API_KEY = 'sk-...'` before starting" -ForegroundColor Yellow
Write-Host ""

node bin/codeforge @args

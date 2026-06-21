@echo off
cd /d "%~dp0"
echo Starting Codeforge...
echo If you haven't set an API key yet, create a .env file or set OPENAI_API_KEY
echo.
node bin/codeforge %*
pause

@echo off
cd /d "%~dp0"
pnpm --filter @weelink/web exec next dev -p 3005
